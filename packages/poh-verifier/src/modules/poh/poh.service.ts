import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Address, privateKeyToAccount } from 'viem/accounts';
import { utils } from 'ethers'

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
  ) {}

  onModulteInit() {}

  async signMessage(address: Address): Promise<string> {
    this.logger.log({ address });
    const ens = this.configService.get<EnsConfig>('ens');
    const chainId = this.configService.get<number>('chainId');

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
      } 

      const message = {
        to: address,
      };
      const serializedData = utils._TypedDataEncoder.encode(domain, types, message);
      return await this.signerService.signTypedData(serializedData);
    } catch (error) {
      this.logger.error({ address, error });
      throw error;
    }
  }



}
