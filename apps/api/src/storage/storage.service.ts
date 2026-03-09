import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly client: Client;
  private readonly bucketName: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = Number(process.env.MINIO_PORT ?? '9000');
    const accessKey = process.env.MINIO_ACCESS_KEY ?? 'app';
    const secretKey = process.env.MINIO_SECRET_KEY ?? 'appappapp';
    this.bucketName = process.env.MINIO_BUCKET ?? 'pension-ai-analyzer';

    this.client = new Client({
      endPoint: endpoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
    });
  }

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) {
      await this.client.makeBucket(this.bucketName, '');
    }
  }

  async uploadFile(buffer: Buffer, mimeType: string, originalFileName: string): Promise<string> {
    await this.ensureBucketExists();
    const objectName = `${randomUUID()}-${originalFileName}`;

    try {
      await this.client.putObject(this.bucketName, objectName, buffer, buffer.length, {
        'Content-Type': mimeType,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to upload file');
    }

    return objectName;
  }

  async getFile(objectName: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucketName, objectName);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      throw new InternalServerErrorException('Failed to download file');
    }
  }
}

