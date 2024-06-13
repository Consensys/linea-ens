import { Module } from '@nestjs/common';

import { SignerModule } from 'src/modules/signer/signer.module';
import { PohController } from './poh.controller';
import { PohService } from './poh.service';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [ApiModule, SignerModule],
  providers: [PohService],
  exports: [PohService],
  controllers: [PohController],
})
export class PohModule {}
