import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import winston from 'winston';
import { utilities, WinstonModule } from 'nest-winston';

import config from 'src/config/config';
import { Environment, LogConfig } from './config/config.interface';
import { configValidator } from 'src/config/config.validator';
import { AppController } from './modules/app/app.controller';
import { AppService } from './modules/app/app.service';
import { ApiModule } from './modules/api/api.module';
import { PohModule } from './modules/poh/poh.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      validationSchema: configValidator,
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const name = configService.get<string>('name');
        const env = configService.get<Environment>('env');
        const logConfig = configService.get<LogConfig>('log');
        return {
          transports: [
            new winston.transports.Console({
              level: logConfig.level,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                env !== Environment.PRODUCTION
                  ? utilities.format.nestLike(name, {
                      colors: true,
                      prettyPrint: true,
                    })
                  : winston.format.json(),
              ),
            }),
          ],
        };
      },
    }),
    ApiModule,
    PohModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
