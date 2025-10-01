import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PohService } from './poh.service';
import { Address, isAddress } from 'viem';

@ApiTags('PoH')
@Controller('poh')
export class PohController {
  private readonly logger = new Logger(PohController.name);

  constructor(private readonly pohService: PohService) {}

  @Get(':address')
  async signMessage(@Param('address') address: Address): Promise<string> {
    if (!isAddress(address)) {
      this.logger.warn(`Invalid Ethereum address received: ${address}`);
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.pohService.signMessage(address);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('v2/:address')
  async signMessageV2(@Param('address') address: Address): Promise<string> {
    if (!isAddress(address)) {
      this.logger.warn(`Invalid Ethereum address received: ${address}`);
      throw new HttpException('Invalid Ethereum address', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.pohService.signMessage(address, true);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
