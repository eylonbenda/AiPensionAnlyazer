import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DocumentsModule } from './documents/documents.module';
import { JobsModule } from './jobs/jobs.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [DocumentsModule, JobsModule, StorageModule, QueueModule, AnalysisModule, TasksModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

