import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Load environment from the repo root .env
dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`);
}

bootstrap();

