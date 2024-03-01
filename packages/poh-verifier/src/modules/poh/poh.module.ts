import { Module } from '@nestjs/common';

import { PohController } from './poh.controller';
import { PohService } from './poh.service';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [ApiModule],
  providers: [PohService],
  exports: [PohService],
  controllers: [PohController],
})
export class PohModule {}
