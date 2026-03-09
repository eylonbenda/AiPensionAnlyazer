import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageModule } from '../storage/storage.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [StorageModule, QueueModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}

