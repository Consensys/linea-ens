import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Address } from 'viem';
import { PohAttestationResponse } from './types/poh';

@Injectable()
export class ApiService {
  Date;

  constructor(private readonly httpService: HttpService) {}

  async getPoh(address: Address): Promise<PohAttestationResponse> {
    const observable = this.httpService
      .get(`poh/${address}`)
      .pipe(map((res) => res.data));

    try {
      const poh = await lastValueFrom(observable);
      return poh;
    } catch (error) {
      console.error('Error processing:', address, error);
    }
  }
}
