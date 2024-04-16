import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import type { CorsConfig, SwaggerConfig } from 'src/config/config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Winston Logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Validation
  app.useGlobalPipes(new ValidationPipe());

  // Config
  const configService = app.get(ConfigService);
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');
  const corsConfig = configService.get<CorsConfig>('cors');

  // Swagger Api
  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup(swaggerConfig.path, app, document);
  }

  // Cors
  if (corsConfig.enabled) {
    app.enableCors();
  }

  // Start
  await app.listen(configService.get<number>('port'));

  // Startup Logging
  const logger = new Logger();
  logger.log(
    `${configService.get<string>('name')} v${configService.get<string>(
      'version',
    )} ${configService.get<string>(
      'env',
    )} started on port: ${configService.get<number>('port')}`,
  );
}
bootstrap();
