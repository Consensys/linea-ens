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
   * @param blockNo A `ProvableBlock`'s number returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slots An array of slots to fetch data for.
   * @returns A proof of the given slots, encoded in a manner that this service's
   *   corresponding decoding library will understand.
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

    // We have to reinitialize the provider L2 because of an issue when multiple
    // requests are sent at the same time, the provider becomes unaware of
    // the linea_getProof method

    const providerConfigs = this.providerL2.providerConfigs;

    for (const config of providerConfigs) {
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
