import { EVMGateway } from "./evm-gateway";
import { JsonRpcProvider } from "ethers";
import { L2ProofService, L2ProvableBlock } from "./L2ProofService";
export type L1Gateway = EVMGateway<L2ProvableBlock>;
export declare function makeL2Gateway(providerL1: JsonRpcProvider, providerL2: JsonRpcProvider, rollupAddress: string, shomeiNode?: JsonRpcProvider): L1Gateway;
export { L2ProofService, L2ProvableBlock };
