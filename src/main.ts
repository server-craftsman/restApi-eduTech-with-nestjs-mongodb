import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { Express } from 'express';
import * as express from 'express';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';

config();

async function bootstrap() {
  // Setup timeout handler - exit app if bootstrap takes too long
  const timeoutId = setTimeout(() => {
    console.error('Bootstrap timeout detected - exiting application');
    process.exit(1);
  }, 60000); // 60 seconds timeout

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    clearTimeout(timeoutId);

    const expressApp = app.getHttpAdapter().getInstance() as Express;
    const configService = app.get(ConfigService);

    const allowedOrigins = configService.get<string[]>('cors.origin');
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type,Accept,Authorization',
    });

    // Parse JSON with size limit
    expressApp.use(express.json({ limit: '10mb' }));
    expressApp.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Serve static files from public folder
    expressApp.use(express.static(join(process.cwd(), 'public')));

    // Ignore Chrome DevTools probe endpoint to avoid noisy 404 logs
    expressApp.get(
      '/.well-known/appspecific/com.chrome.devtools.json',
      (_req, res) => {
        res.status(204).end();
      },
    );

    // Increase timeout for long-running requests (120 seconds = 2 minutes)
    expressApp.use((req, res, next) => {
      req.setTimeout(120000);
      res.setTimeout(120000);
      next();
    });

    // Global validation pipe
    app.useGlobalPipes(
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

    // Global exception filter — Format all errors consistently
    app.useGlobalFilters(new HttpExceptionFilter());

    // Process-level error handlers for graceful shutdown on critical errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

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
      customCssUrl: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
      customJs: [
        'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
      ],
      customfavIcon: 'https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png',
      customSiteTitle: 'EduTech API Docs',
    });

    // Backward-compatible redirect for old prefixed Swagger URL
    expressApp.get(`/${globalPrefix}/swagger`, (_req, res) => {
      res.redirect(302, '/swagger');
    });
    expressApp.get(`/${globalPrefix}/swagger/`, (_req, res) => {
      res.redirect(302, '/swagger');
    });

    await app.listen(port, '0.0.0.0');
    console.log(`Server is running...`);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Fatal error during bootstrap:', error);
    process.exit(1);
  }
}

void bootstrap();
