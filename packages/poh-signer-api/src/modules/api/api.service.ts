import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Address } from 'viem';
import { ApiConfig } from 'src/config/config.interface';

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const apiConfig = this.configService.get<ApiConfig>('pohApi');
    this.axiosInstance = axios.create({
      baseURL: apiConfig.url,
      timeout: 5000,
      maxRedirects: 3,
    });
  }

  async getPoh(address: Address, isV2: boolean = false): Promise<boolean> {
    try {
      const { data } = await this.axiosInstance.get(
        `poh/${isV2 ? 'v2/' : ''}${address}`,
      );
      return isV2 ? data : data.poh;
    } catch (error) {
      this.logger.error('Error processing:', address, error);
      return false;
    }
  }
}
