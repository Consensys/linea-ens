import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PohService } from '../poh/poh.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly pohService: PohService,
  ) {}

  @Get()
  getWelcome(): string {
    return this.appService.getWelcome();
  }
}
