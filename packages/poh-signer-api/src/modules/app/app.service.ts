import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getWelcome(): string {
    const name = this.configService.get<string>('name');
    const version = this.configService.get<string>('version');
    return `${name} - v${version}`;
  }
}
