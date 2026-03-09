import { prisma } from '@pension-analyzer/database';
import type { TaskDefinition } from './task-generator';

export async function upsertTasksForDocument(
  tx: typeof prisma,
  documentId: string,
  taskDefinitions: TaskDefinition[],
): Promise<void> {
  for (const def of taskDefinitions) {
    await (tx as typeof prisma).task.upsert({
      where: {
        documentId_taskKey: {
          documentId,
          taskKey: def.taskKey,
        },
      },
      update: {
        title: def.title,
        description: def.description,
        priority: def.priority,
        sourceType: def.sourceType,
        sourceRef: def.sourceRef ?? null,
        relatedPlanIndexes: def.relatedPlanIndexes ?? [],
      },
      create: {
        documentId,
        taskKey: def.taskKey,
        title: def.title,
        description: def.description,
        status: 'TODO',
        priority: def.priority,
        sourceType: def.sourceType,
        sourceRef: def.sourceRef ?? null,
        relatedPlanIndexes: def.relatedPlanIndexes ?? [],
      },
    });
  }
}

