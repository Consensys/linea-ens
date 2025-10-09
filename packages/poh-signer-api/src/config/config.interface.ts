import { Address, Hex } from 'viem';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  PROVISION = 'provision',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export interface Config {
  env: Environment;
  name: string;
  port: number;
  version: string;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  ens: EnsConfig;
  pohApi: ApiConfig;
  web3signer: Web3SignerConfig;
  log: LogConfig;
  chainId: number;
}

export interface CorsConfig {
  enabled: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
}

export interface EnsConfig {
  verifierContractAddress: Address;
}

export interface ApiConfig {
  url: string;
}

export interface Web3SignerConfig {
  baseUrl: string;
  publicKey: Hex;
  keystorePath: string;
  keystorePassphrase: string;
  trustedStorePath: string;
  trustedStorePassphrase: string;
}

export interface LogConfig {
  level: LogLevel;
}
