import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@pension-analyzer/database';

const ALLOWED_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'DISMISSED'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

@Injectable()
export class TasksService {
  async getTasksForDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const tasks = await prisma.task.findMany({
      where: { documentId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return tasks;
  }

  async updateTaskStatus(taskId: string, status: string) {
    if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
      throw new BadRequestException('Invalid task status');
    }

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: status as AllowedStatus },
    });

    return updated;
  }
}

