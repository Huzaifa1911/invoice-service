/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { AppLogger } from './app/logger/logger';
import { GLOBAL_PREFIX } from './app/utils/constants';
import { AppExceptionFilter } from './app/filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new AppLogger('app-root'),
  });

  app.setGlobalPrefix(GLOBAL_PREFIX).useGlobalFilters(new AppExceptionFilter());

  // Enable Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Invoice App API')
    .setDescription('Invoice App API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });

  // Enable CORS for development environment
  if (process.env?.CONFIGURATION === 'development') {
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
      credentials: true, // Allow cookies and authorization headers
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`
  );
}

bootstrap();
