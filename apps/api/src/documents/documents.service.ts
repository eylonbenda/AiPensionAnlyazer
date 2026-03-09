import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma, JobStatus } from '@pension-analyzer/database';
import { StorageService } from '../storage/storage.service';
import { QueueService } from '../queue/queue.service';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@pension-analyzer/common';
import { UploadedFileType } from './file-upload.type';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storageService: StorageService,
    private readonly queueService: QueueService,
  ) {}

  validateFile(file?: UploadedFileType): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the maximum allowed (10MB)');
    }
  }

  async createDocumentFromUpload(file: UploadedFileType) {
    this.validateFile(file);

    const storageKey = await this.storageService.uploadFile(
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const result = await prisma.$transaction(async (tx) => {
      const createdDocument = await tx.document.create({
        data: {
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          storageKey,
        },
      });

      const createdJob = await tx.job.create({
        data: {
          documentId: createdDocument.id,
          status: JobStatus.PENDING,
          attempts: 0,
        },
      });

      return { createdDocument, createdJob };
    });

    await this.queueService.enqueueDocumentJob(result.createdJob.id);

    return {
      documentId: result.createdDocument.id,
      jobId: result.createdJob.id,
    };
  }
}

