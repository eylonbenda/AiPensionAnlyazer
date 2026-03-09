import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@pension-analyzer/database';

@Injectable()
export class JobsService {
  async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getJobsForDocument(documentId: string) {
    return prisma.job.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

