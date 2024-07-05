import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { ApiConfig } from 'src/config/config.interface';
import { ApiService } from './api.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<ApiConfig>('pohApi').url,
        timeout: 5000,
        maxRedirects: 3,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}
