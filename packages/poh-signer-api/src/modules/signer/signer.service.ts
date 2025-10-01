import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Web3SignerConfig } from 'src/config/config.interface';
import { Hex } from 'viem';

@Injectable()
export class SignerService {
  private readonly logger = new Logger(SignerService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create();
  }

  async signTypedData(data: string): Promise<Hex> {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer');
    const url = new URL(
      `/api/v1/eth1/sign/${web3signer.publicKey}`,
      web3signer.baseUrl,
    );

    try {
      const response = await this.axiosInstance.post(url.href, {
        data: data,
      });

      return response.data;
    } catch (error) {
      this.logger.error({
        message: 'Failed to sign typed data',
        url,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
