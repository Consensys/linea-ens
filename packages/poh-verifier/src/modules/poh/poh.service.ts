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
    this.logger.log({ address });
    const ens = this.configService.get<EnsConfig>('ens');
    const chainId = this.configService.get<number>('chainId');
    let signature: string | undefined;

    try {
      const pohResponse = await this.apiService.getPoh(address);

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

      signature = await signerAccount.signTypedData({
        domain,
        types,
        primaryType: 'POH',
        message: {
          to: address,
        },
      });

      return signature;
    } catch (error) {
      this.logger.error({ address, signature, error });
      throw error;
    }
  }
}
