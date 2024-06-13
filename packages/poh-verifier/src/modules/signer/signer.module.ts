import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignerService } from './signer.service'

@Module({
  imports: [HttpModule],
  providers: [SignerService],
  exports: [SignerService],
})
export class SignerModule {}
