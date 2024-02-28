import { AbiCoder, AddressLike, JsonRpcProvider, Contract } from "ethers";

import { EVMProofHelper, IProofService } from "./evm-gateway";

import rollupAbi from "./abi/rollup.json";

export type L2ProvableBlock = number;

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class L2ProofService implements IProofService<L2ProvableBlock> {
  private readonly rollup: Contract;
  private readonly helper: EVMProofHelper;

  constructor(
    providerL1: JsonRpcProvider,
    providerL2: JsonRpcProvider,
    rollupAddress: string
  ) {
    this.helper = new EVMProofHelper(providerL2);
    this.rollup = new Contract(rollupAddress, rollupAbi, providerL1);
  }

  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  async getProvableBlock(): Promise<number> {
    const lastBlockFinalized = await this.rollup.currentL2BlockNumber();
    if (!lastBlockFinalized) throw new Error("No block found");
    const block = lastBlockFinalized.toNumber();
    return block;
  }

  /**
   * @dev Returns the value of a contract state slot at the specified block
   * @param block A `ProvableBlock` returned by `getProvableBlock`.
   * @param address The address of the contract to fetch data from.
   * @param slot The slot to fetch.
   * @returns The value in `slot` of `address` at block `block`
   */
  getStorageAt(
    block: L2ProvableBlock,
    address: AddressLike,
    slot: bigint
  ): Promise<string> {
    return this.helper.getStorageAt(block, address, slot);
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
    blockNo: L2ProvableBlock,
    address: AddressLike,
    slots: bigint[]
  ): Promise<string> {
    const proof = await this.helper.getProofs(blockNo, address, slots);
    return AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes, uint256, tuple(bytes, bytes[]))",
        "tuple(bytes, uint256, tuple(bytes, bytes[]))[]",
      ],
      [blockNo, proof.accountProof, proof.storageProofs]
    );
  }
}
