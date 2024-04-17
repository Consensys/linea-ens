import { Config, Environment, LogLevel } from './config.interface';
import * as pack from '../../package.json';
import { Address } from 'viem';

const convertToName = (inputString: string): string => {
  return inputString
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const name = convertToName(pack.name);

export default (): Config => ({
  env: (process.env.NODE_ENV as Environment) || Environment.PRODUCTION,
  name,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  version: pack.version,
  chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1337,

  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    title: `${name} Swagger`,
    description: `${name} Swagger definitions`,
    version: pack.version,
    path: 'docs',
  },
  ens: {
    verifierContractAddress: process.env.VERIFIER_CONTRACT_ADDRESS as Address,
    signerPrivateKey: process.env.SIGNER_PRIVATE_KEY as Address,
  },
  pohApi: {
    url: process.env.POH_API_URL,
  },
  log: {
    level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  },
});
