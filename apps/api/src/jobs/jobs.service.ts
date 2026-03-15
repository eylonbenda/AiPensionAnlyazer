import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@pension-analyzer/database';

@Injectable()
export class JobsService {
  async getJobById(id: string, userId: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!job || job.document.userId !== userId) {
      throw new NotFoundException('Job not found');
    }

    const { document: _doc, ...jobWithoutDocument } = job;
    return jobWithoutDocument;
  }

  async getJobsForDocument(documentId: string) {
    return prisma.job.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

