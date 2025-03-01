// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingService } from './modules/logging/logging.service';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [''];

  app.enableCors({ origin: allowedOrigins });

  const loggingService = app.get(LoggingService);
  app.useGlobalFilters(new GlobalExceptionFilter(loggingService));

  // Enhanced Swagger configuration with security definitions
  const configSwagger = new DocumentBuilder()
    .setTitle('OutSystems SQL Toolkit API')
    .setDescription(
      'Comprehensive API documentation for Outsystems SQL toolkit service.',
    )
    .setVersion('1.0')
    // Define the security scheme more explicitly
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'access-token', // This is the security scheme name
    )
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);

  // Add security requirement globally
  document.security = [{ 'access-token': [] }];

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
