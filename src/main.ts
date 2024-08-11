import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { join } from 'path';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(express()));

  app.use(express.static(join(__dirname, '..', 'public')));

  await app.listen(3000);
}
bootstrap();
