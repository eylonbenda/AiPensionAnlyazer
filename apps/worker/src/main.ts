import { Worker, Job } from 'bullmq';
import { DOCUMENT_PROCESSING_QUEUE } from '@pension-analyzer/common';
import { prisma, JobStatus } from '@pension-analyzer/database';
import { computeRedFlags, extractStructured, PensionExtraction, RedFlag } from '@pension-analyzer/ai';
import { Client } from 'minio';
import pdfParse from 'pdf-parse';
import { URL } from 'url';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { buildTasksFromAnalysis } from './tasks/task-generator';
import { upsertTasksForDocument } from './tasks/task-service';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

function buildRedisConnection() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
  };
}

function createMinioClient() {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = Number(process.env.MINIO_PORT ?? '9000');
  const accessKey = process.env.MINIO_ACCESS_KEY ?? 'app';
  const secretKey = process.env.MINIO_SECRET_KEY ?? 'appappapp';
  const bucket = process.env.MINIO_BUCKET ?? 'pension-ai-analyzer';

  const client = new Client({
    endPoint: endpoint,
    port,
    useSSL: false,
    accessKey,
    secretKey,
  });

  return { client, bucket };
}

async function downloadFile(client: Client, bucket: string, objectName: string): Promise<Buffer> {
  const stream = await client.getObject(bucket, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

async function processJobById(jobId: string): Promise<void> {
  const rows = (await prisma.$queryRawUnsafe(
    `
      UPDATE "Job"
      SET status = $2::"JobStatus",
          "startedAt" = COALESCE("startedAt", NOW()),
          "lockedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $1
        AND status IN ($3::"JobStatus", $4::"JobStatus")
      RETURNING id, "documentId"
    `,
    jobId,
    JobStatus.RUNNING,
    JobStatus.PENDING,
    JobStatus.FAILED,
  )) as { id: string; documentId: string }[];

  const [{ id, documentId } = {} as any] = rows ?? [];

  if (!id || !documentId) {
    // Job is already RUNNING or DONE; nothing to do
    return;
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        finishedAt: new Date(),
        attempts: { increment: 1 },
        error: 'Document not found',
      },
    });
    return;
  }

  const { client, bucket } = createMinioClient();

  try {
    const buffer = await downloadFile(client, bucket, document.storageKey);
    const result = await pdfParse(buffer);

    const extractionText = result.text ?? '';

    let structured: unknown | null = null;
    let analysisError: string | null = null;
    let redFlags: unknown | null = null;

    try {
      const aiResult = await extractStructured({
        text: extractionText,
        meta: {
          numPages: result.numpages,
        },
      });

      if (aiResult.ok) {
        structured = aiResult.result.json;
        redFlags = computeRedFlags(aiResult.result.json as PensionExtraction);
      } else {
        analysisError = aiResult.error;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown AI extraction error';
      analysisError = message;
    }

    const typedStructured =
      structured && typeof structured === 'object'
        ? (structured as PensionExtraction)
        : null;
    const typedRedFlags =
      Array.isArray(redFlags) && redFlags.length > 0
        ? (redFlags as RedFlag[])
        : [];

    const taskDefinitions = buildTasksFromAnalysis({
      structured: typedStructured,
      redFlags: typedRedFlags,
      gapInsight: null,
    });

    await prisma.$transaction(async (tx: typeof prisma) => {
      await (tx as typeof prisma).extraction.create({
        data: {
          documentId: document.id,
          text: extractionText,
          meta: {
            numPages: result.numpages,
          },
          structured,
          analysisError,
          redFlags,
        },
      });

      if (taskDefinitions.length > 0) {
        await upsertTasksForDocument(tx as typeof prisma, document.id, taskDefinitions);
      }

      await (tx as typeof prisma).job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.DONE,
          finishedAt: new Date(),
          attempts: { increment: 1 },
          error: null,
        },
      });
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error during PDF extraction';

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        finishedAt: new Date(),
        attempts: { increment: 1 },
        error: message,
      },
    });
  }
}

async function bootstrap() {
  const worker = new Worker(
    DOCUMENT_PROCESSING_QUEUE,
    async (job: Job) => {
      const payload = job.data as { jobId?: string };
      if (!payload?.jobId) {
        return;
      }
      await processJobById(payload.jobId);
    },
    {
      connection: buildRedisConnection(),
    },
  );

  worker.on('ready', () => {
    // eslint-disable-next-line no-console
    console.log('worker started');
  });

  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error('Job processing failed', job?.id, err?.message);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});

