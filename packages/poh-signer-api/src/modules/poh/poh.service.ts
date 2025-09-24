import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Address } from 'viem/accounts';
import { ethers } from 'ethers';

import type { EnsConfig } from 'src/config/config.interface';
import { SignerService } from 'src/modules/signer/signer.service';
import { ApiService } from '../api/api.service';

@Injectable()
export class PohService {
  private readonly logger = new Logger(PohService.name);

  constructor(
    private configService: ConfigService,
    private apiService: ApiService,
    private readonly signerService: SignerService,
  ) {
  }

  async signMessage(address: Address, isV2: boolean = false): Promise<string> {
    this.logger.log({ address });
    const ens = this.configService.get<EnsConfig>('ens');
    const chainId = this.configService.get<number>('chainId');

    try {
      const pohStatus = await this.apiService.getPoh(address, isV2);

      if (!pohStatus) {
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
      };

      const message = {
        to: address,
      };
      const serializedData = ethers.TypedDataEncoder.encode(
        domain,
        types,
        message,
      );
      return await this.signerService.signTypedData(serializedData);
    } catch (error) {
      this.logger.error({ address, error });
      throw error;
    }
  }
}
