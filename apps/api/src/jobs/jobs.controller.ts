import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@pension-analyzer/domain';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':id')
  async getJob(
    @Param('id') id: string,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
  ) {
    return this.jobsService.getJobById(id, user.id);
  }
}

