import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Web3SignerConfig } from 'src/config/config.interface';
import { Hex } from 'viem';
import { Agent } from 'https';
import forge from 'node-forge';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class SignerService {
  private readonly logger = new Logger(SignerService.name);
  private readonly axiosInstance: AxiosInstance;
  private httpsAgent: Agent;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create();
    this.validateWeb3SignerConfig();
    this.initializeHttpsAgent();
  }

  async signTypedData(data: string): Promise<Hex> {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer');
    const url = new URL(
      `/api/v1/eth1/sign/${web3signer.publicKey}`,
      web3signer.baseUrl,
    );

    this.logger.debug({
      message: 'Calling Web3Signer to sign typed data',
      url: url.href,
      publicKey: web3signer.publicKey,
      dataLength: data.length,
    });

    try {
      const startTime = Date.now();
      const response = await this.axiosInstance.post(
        url.href,
        {
          data: data,
        },
        {
          httpsAgent: this.httpsAgent,
        },
      );

      const duration = Date.now() - startTime;

      this.logger.log({
        message: 'Successfully signed typed data with Web3Signer',
        url: url.href,
        duration: `${duration}ms`,
        signatureLength: response.data?.length || 0,
      });

      return response.data;
    } catch (error) {
      this.logger.error({
        message: 'Failed to sign typed data',
        url: url.href,
        error: error.message,
        stack: error.stack,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  convertToPem(p12Der: string | forge.util.ByteStringBuffer, password: string) {
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    return this.getCertificateFromP12(p12);
  }

  getCertificateFromP12(p12: forge.pkcs12.Pkcs12Pfx) {
    const certData = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certificate = certData[forge.pki.oids.certBag]?.[0];

    if (!certificate?.cert) {
      throw new Error('Certificate not found in P12');
    }

    return forge.pki.certificateToPem(certificate.cert);
  }

  private validateWeb3SignerConfig(): void {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer');

    if (!web3signer) {
      throw new Error('Web3Signer configuration is missing');
    }

    // Validate core fields required in all environments
    const coreRequiredFields: (keyof Web3SignerConfig)[] = [
      'baseUrl',
      'publicKey',
    ];

    for (const field of coreRequiredFields) {
      const value = web3signer[field];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        throw new Error(
          `Web3Signer configuration error: ${field} is required but not provided or is empty`,
        );
      }
    }

    // Validate certificate fields required in non-development environments
    const certificateRequiredFields: (keyof Web3SignerConfig)[] = [
      'keystorePath',
      'keystorePassphrase',
      'trustedStorePath',
      'trustedStorePassphrase',
    ];

    for (const field of certificateRequiredFields) {
      const value = web3signer[field];
      if (!value || typeof value !== 'string' || value.trim() === '') {
        throw new Error(
          `Web3Signer configuration error: ${field} is required in non-development environments but not provided or is empty`,
        );
      }
    }
  }

  private initializeHttpsAgent(): void {
    const web3signer = this.configService.get<Web3SignerConfig>('web3signer');

    try {
      this.httpsAgent = this.createWeb3SignerHttpsAgent(
        web3signer.keystorePath,
        web3signer.keystorePassphrase,
        web3signer.trustedStorePath,
        web3signer.trustedStorePassphrase,
      );
      this.logger.log('HTTPS agent initialized successfully');
    } catch (error) {
      this.logger.error({
        message: 'Failed to initialize HTTPS agent',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  private createWeb3SignerHttpsAgent(
    keystorePath: string,
    keystorePassphrase: string,
    trustedStorePath: string,
    trustedStorePassphrase: string,
  ): Agent {
    this.logger.log('Creating HTTPS agent with mTLS configuration');

    // Load client certificate (pfx contains both cert and private key)
    const keystoreFullPath = path.resolve(process.cwd(), keystorePath);
    const clientPfx = readFileSync(keystoreFullPath);

    // Load trusted CA certificate (server certificate)
    const trustedStoreFullPath = path.resolve(process.cwd(), trustedStorePath);
    const trustedStoreFile = readFileSync(trustedStoreFullPath, {
      encoding: 'binary',
    });

    const caCertPem = this.convertToPem(
      trustedStoreFile,
      trustedStorePassphrase,
    );

    return new Agent({
      pfx: clientPfx,
      passphrase: keystorePassphrase,
      ca: caCertPem,
      requestCert: true,
    });
  }
}
