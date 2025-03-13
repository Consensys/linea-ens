import {
  AddressLike,
  FallbackProvider,
  JsonRpcProvider,
  toBeHex,
} from 'ethers';
import { logDebug, logInfo } from '../utils';

interface ProofStruct {
  key: string;
  leafIndex: number;
  leftLeafIndex: number | undefined;
  rightLeafIndex: number | undefined;
  proof: {
    value: string;
    proofRelatedNodes: string[];
  };
  leftProof: { value: string; proofRelatedNodes: string[] } | undefined;
  rightProof: { value: string; proofRelatedNodes: string[] } | undefined;
  initialized: boolean | true;
}

export interface StateProof {
  accountProof: ProofStruct;
  storageProofs: ProofStruct[];
}

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class EVMProofHelper {
  private readonly providerL2: FallbackProvider;

  constructor(providerL2: FallbackProvider) {
    this.providerL2 = providerL2;
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param blockNo A `ProvableBlock`'s number returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  getStorageAt(
    blockNo: number,
    address: AddressLike,
    slot: bigint,
  ): Promise<string> {
    return this.providerL2.getStorage(address, slot, blockNo);
  }

  /**
   * @dev Fetches a set of proofs for the requested state slots.
   *
   * Since `FallbackProvider` does not support sending custom RPC requests directly,
   * we manually iterate over its underlying providers (which are `JsonRpcProvider` instances).
   *
   * @param blockNo The block number from which to retrieve the state proof.
   * @param address The contract address for which the proof is requested.
   * @param slots An array of storage slots to fetch proofs for.
   * @returns A `StateProof` object containing the proof data for the given slots.
   */
  async getProofs(
    blockNo: number,
    address: AddressLike,
    slots: bigint[],
  ): Promise<StateProof> {
    const args: (AddressLike | string[])[] = [
      address,
      slots.map(slot => toBeHex(slot, 32)),
      '0x' + blockNo.toString(16),
    ];

    logInfo('Calling linea_getProof with args', args);

    // `FallbackProvider` does not allow direct custom RPC calls.
    // Instead, we iterate over its configured providers and send the request manually.
    const providerConfigs = this.providerL2.providerConfigs;

    for (const config of providerConfigs) {
      // Extract the underlying provider, which is a `JsonRpcProvider`
      // @ts-expect-error - We know this is a JsonRpcProvider
      const provider: JsonRpcProvider = config.provider;

      try {
        logDebug(`Trying provider with URL: ${provider._getConnection().url}`);

        const proofs: StateProof = await provider.send('linea_getProof', args);

        logDebug('Proof result from provider:', proofs);

        return proofs;
      } catch (error) {
        logInfo(`Provider failed: ${provider._getConnection().url}`, error);
      }
    }

    throw new Error('All providers failed to fetch linea_getProof');
  }
}
