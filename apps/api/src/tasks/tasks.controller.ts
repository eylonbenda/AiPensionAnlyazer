import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('documents/:documentId/tasks')
  async getTasksForDocument(@Param('documentId') documentId: string) {
    return this.tasksService.getTasksForDocument(documentId);
  }

  @Patch('tasks/:taskId')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: string,
  ) {
    return this.tasksService.updateTaskStatus(taskId, status);
  }
}

