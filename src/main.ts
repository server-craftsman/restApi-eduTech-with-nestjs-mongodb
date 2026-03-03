import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { Express } from 'express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  const configService = app.get(ConfigService);

  const allowedOrigins = configService.get<string[]>('cors.origin');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // Configure Handlebars template engine
  expressApp.set('views', join(process.cwd(), 'views'));
  expressApp.set('view engine', 'hbs');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Set global API prefix from configuration (excludes home module)
  const apiPrefix = configService.get<string>('api.prefix');
  const apiVersion = configService.get<string>('api.version');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;

  // Apply prefix to all routes except home (which is at root /)
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/', '/favicon.ico'],
  });

  const port = configService.get<number>('PORT') || 3000;

  const apiConfig = new DocumentBuilder()
    .setTitle('EduTech API')
    .setDescription('REST API documentation')
    .setVersion('1.0.0')
    .addServer(`http://localhost:${port}`, 'Local Development')
    .addServer(
      `${configService.get<string>('APP_URL')}`,
      'Production Server',
    )
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, apiConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on http://localhost:${port}`);
}

void bootstrap();
