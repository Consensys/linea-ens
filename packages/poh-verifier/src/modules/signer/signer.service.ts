import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { lastValueFrom } from 'rxjs'
import { Web3SignerConfig } from 'src/config/config.interface'
import { Hex, serializeTransaction, Transaction } from 'viem'

@Injectable()
export class SignerService {
  private readonly logger = new Logger(SignerService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async signTransaction(transaction: any): Promise<Hex> {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer')
    const url = new URL(
      `/api/v1/eth1/sign/${web3signer.publicKey}`,
      web3signer.baseUrl,
    )

    try {
      const res = this.httpService.post(url.href, {
        data: serializeTransaction(transaction),
      })

      return (await lastValueFrom(res)).data
    } catch (error) {
      this.logger.error({
        message: 'Failed to sign transaction',
        url,
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  

  async signTypedData(domain: any, types: any, primaryType: string, message: any): Promise<Hex> {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer')
    const url = new URL(
      `/api/v1/eth1/sign/${web3signer.publicKey}`,
      web3signer.baseUrl,
    )

    try {
      const res = this.httpService.post(url.href, {
        "data": 5.735816763073855e+30
      })
//  const res = this.httpService.post(url.href, {data: JSON.stringify({
//         domain,
//         types,
//         primaryType,
//         message,
//       })})

      return (await lastValueFrom(res)).data
    } catch (error) {
      this.logger.error({
        message: 'Failed to sign typed data',
        url,
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }
}
