import { toBeHex, AddressLike, JsonRpcProvider, ethers } from "ethers";
import { logDebug } from "../utils";

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
  private readonly providerL2: JsonRpcProvider;
  private readonly shomeiNode: JsonRpcProvider;

  constructor(providerL2: JsonRpcProvider, shomeiNode?: JsonRpcProvider) {
    this.providerL2 = providerL2;
    // shomeiNode optional since an rpc infura nodes can support both eth_getStorageAt and linea_getProof
    this.shomeiNode = shomeiNode ? shomeiNode : providerL2;
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  getStorageAt(
    blockNo: number,
    address: AddressLike,
    slot: bigint
  ): Promise<string> {
    return this.providerL2.getStorage(address, slot, blockNo);
  }

  /**
   * @dev Fetches a set of proofs for the requested state slots.
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slots An array of slots to fetch data for.
   * @returns A proof of the given slots, encoded in a manner that this service's
   *   corresponding decoding library will understand.
   */
  async getProofs(
    blockNo: number,
    address: AddressLike,
    slots: bigint[]
  ): Promise<StateProof> {
    const args = [
      address,
      slots.map((slot) => toBeHex(slot, 32)),
      "0x" + blockNo.toString(16),
    ];

    logDebug("Starting getProofs", args);

    // We have to reinitilize the provider L2 because of an issue when multiple
    // requests are sent at the same time, the provider becomes not aware of
    // the linea_getProof method
    const providerUrl = await this.shomeiNode._getConnection().url;
    const providerChainId = await this.shomeiNode._network.chainId;
    const providerL2 = new ethers.JsonRpcProvider(
      providerUrl,
      providerChainId,
      {
        staticNetwork: true,
      }
    );
    logDebug("Calling linea_getProof with L2 provider", providerUrl);
    const proofs: StateProof = await providerL2.send("linea_getProof", args);
    logDebug("Proof result", proofs);
    return proofs;
  }
}
