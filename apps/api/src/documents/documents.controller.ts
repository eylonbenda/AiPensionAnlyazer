import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentResponseDto } from './dto/create-document.response';
import { UploadedFileType } from './file-upload.type';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: UploadedFileType,
  ): Promise<CreateDocumentResponseDto> {
    return this.documentsService.createDocumentFromUpload(file);
  }
}

