import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Address } from 'viem';

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {
  }

  async getPoh(address: Address, isV2: boolean = false): Promise<boolean> {
    const observable = this.httpService
      .get(`poh/${isV2 ? 'v2/' : ''}${address}`)
      .pipe(map((res) => res.data));

    try {
      return await lastValueFrom(observable);
    } catch (error) {
      console.error('Error processing:', address, error);
    }
  }
}
