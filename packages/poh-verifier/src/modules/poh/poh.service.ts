import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Address, privateKeyToAccount } from 'viem/accounts';

import type { EnsConfig } from 'src/config/config.interface';
import { ApiService } from '../api/api.service';

@Injectable()
export class PohService {
  private readonly logger = new Logger(PohService.name);

  constructor(
    private configService: ConfigService,
    private apiService: ApiService,
  ) {}

  onModulteInit() {}

  async signMessage(address: Address): Promise<any> {
    const ens = this.configService.get<EnsConfig>('ens');
    const chainId = this.configService.get<number>('chainId');

    this.logger.log('ENS Config:', JSON.stringify(ens, null, 2));
    this.logger.log('Chain ID:', chainId);

    try {
      const pohResponse = await this.apiService.getPoh(address);
      this.logger.log('POH Response:', JSON.stringify(pohResponse, null, 2));

      if (!pohResponse.poh) {
        throw new Error('address not POH');
      }

      const domain = {
        name: 'VerifyPoh',
        version: '1',
        chainId,
        verifyingContract: ens.verifierContractAddress,
      } as const;

      const types = {
        POH: [{ name: 'to', type: 'address' }],
      } as const;

      const signerAccount = privateKeyToAccount(ens.signerPrivateKey);
      this.logger.log(
        'Signer Account:',
        JSON.stringify(signerAccount, null, 2),
      );

      const signature = await signerAccount.signTypedData({
        domain,
        types,
        primaryType: 'POH',
        message: {
          to: address,
        },
      });

      this.logger.log('Signature:', signature);
      return signature;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
