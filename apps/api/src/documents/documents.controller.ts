import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentResponseDto } from './dto/create-document.response';
import { UploadedFileType } from './file-upload.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@pension-analyzer/domain';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: UploadedFileType,
    @CurrentUser() user: Pick<User, 'id' | 'email' | 'name' | 'createdAt' | 'updatedAt'>,
  ): Promise<CreateDocumentResponseDto> {
    return this.documentsService.createDocumentFromUpload(file, user.id);
  }
}

