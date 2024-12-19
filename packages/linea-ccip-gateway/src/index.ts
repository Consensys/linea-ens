import { EVMGateway } from './evm-gateway';
import { JsonRpcProvider } from 'ethers';
import { L2ProofService, L2ProvableBlock } from './L2ProofService';

export type L1Gateway = EVMGateway<L2ProvableBlock>;

export function makeL2Gateway(
  providerL1: JsonRpcProvider,
  providerL2: JsonRpcProvider,
  rollupAddress: string,
  shomeiNode?: JsonRpcProvider,
): L1Gateway {
  return new EVMGateway(
    new L2ProofService(providerL1, providerL2, rollupAddress, shomeiNode),
  );
}

export { L2ProofService, L2ProvableBlock };
