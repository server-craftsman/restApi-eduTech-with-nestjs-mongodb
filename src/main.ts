import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { Express } from 'express';
import * as express from 'express';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { SanitizeParamsPipe } from './core/pipes/sanitize-params.pipe';

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

  // ═══════════════════════════════════════════════════════════════════
  // Security Hardening
  // ═══════════════════════════════════════════════════════════════════

  // 1. Helmet — Add security HTTP headers
  app.use(
    helmet.default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'https:', 'data:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // 2. Parse JSON with size limit (prevent large payload attacks)
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));

  // 3. Global parameter sanitization
  app.useGlobalPipes(
    new SanitizeParamsPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors
          .map(
            (error) =>
              `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
          )
          .join('; ');
        return new BadRequestException(messages);
      },
    }),
  );

  // 4. Global exception filter — Format all errors consistently
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Handlebars template engine
  expressApp.set('views', join(process.cwd(), 'views'));
  expressApp.set('view engine', 'hbs');

  // Set global API prefix from configuration (excludes home module)
  const apiPrefix = configService.get<string>('api.prefix');
  const apiVersion = configService.get<string>('api.version');
  const globalPrefix = `${apiPrefix}/${apiVersion}`;

  // Apply prefix to all routes except home (which is at root /)
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/', '/favicon.ico'],
  });

  const port = configService.get<number>('PORT') || 3000;

  // ═══════════════════════════════════════════════════════════════════
  // Swagger Configuration with Security
  // ═══════════════════════════════════════════════════════════════════

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EduTech API')
    .setDescription('REST API documentation for EduTech learning platform')
    .setContact('HuyND', '', 'huyit2003@gmail.com')
    .setVersion('1.0.0')
    .addServer(`http://localhost:${port}`, 'Local Development')
    .addServer(`${configService.get<string>('APP_URL')}`, 'Production Server')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      defaultModelsExpandDepth: 2,
    },
    customSiteTitle: 'EduTech API Docs',
  });

  await app.listen(port, '0.0.0.0');
  console.log(`Server is running...`);
  console.log(
    `Security features enabled: Helmet, Rate Limiting, Input Sanitization`,
  );
}

void bootstrap();
