import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@pension-analyzer/domain';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('documents/:documentId/tasks')
  async getTasksForDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
  ) {
    return this.tasksService.getTasksForDocument(documentId, user.id);
  }

  @Patch('tasks/:taskId')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
    @Body('status') status: string,
  ) {
    return this.tasksService.updateTaskStatus(taskId, user.id, status);
  }
}

