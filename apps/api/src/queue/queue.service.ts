import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { DOCUMENT_PROCESSING_QUEUE } from '@pension-analyzer/common';
import { URL } from 'url';

function buildRedisConnection() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
  };
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor() {
    this.queue = new Queue(DOCUMENT_PROCESSING_QUEUE, {
      connection: buildRedisConnection(),
    });
  }

  async enqueueDocumentJob(jobId: string): Promise<void> {
    await this.queue.add(
      'process-document',
      { jobId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}

