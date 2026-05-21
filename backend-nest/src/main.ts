import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Middlewares globales
  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Exception filter global
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('SaaS Inmobiliario API')
    .setDescription('API REST para gestión administrativa de propiedades')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  
  await app.listen(port);
  
  console.log(`Server running on port ${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
}

bootstrap();
