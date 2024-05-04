import {
  AbiCoder,
  AddressLike,
  JsonRpcProvider,
  Contract,
  ethers,
} from "ethers";

import { EVMProofHelper, IProofService, StateProof } from "./evm-gateway";

export type L2ProvableBlock = number;

const currentL2BlockNumberSig =
  "function currentL2BlockNumber() view returns (uint256)";

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
    const currentL2BlockNumberIface = new ethers.Interface([
      currentL2BlockNumberSig,
    ]);
    this.rollup = new Contract(
      rollupAddress,
      currentL2BlockNumberIface,
      providerL1
    );
  }

  /**
   * @dev Returns an object representing a block whose state can be proven on L1.
   */
  async getProvableBlock(): Promise<number> {
    const lastBlockFinalized = await this.rollup.currentL2BlockNumber();
    if (!lastBlockFinalized) throw new Error("No block found");
    return lastBlockFinalized;
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
    let proof = await this.helper.getProofs(blockNo, address, slots);
    proof = this.checkStorageInitialized(proof);
    return AbiCoder.defaultAbiCoder().encode(
      [
        "uint256",
        "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
        "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
      ],
      [blockNo, proof.accountProof, proof.storageProofs]
    );
  }

  /**
   * rollup_getProof returns a different structure when a storage proof is
   * unitialized, to handle this case we return unitialized for this particular storage
   * @param proof
   * @returns modifier proof with the
   */
  checkStorageInitialized(proof: StateProof): StateProof {
    for (let storageProof of proof.storageProofs) {
      if (storageProof.leftProof || storageProof.rightProof) {
        storageProof.proof = storageProof.leftProof;
        storageProof.leafIndex = storageProof.leftLeafIndex;
        storageProof.initialized = false;
        delete storageProof.leftProof;
        delete storageProof.rightProof;
        delete storageProof.leftLeafIndex;
        delete storageProof.rightLeafIndex;
      } else {
        storageProof.initialized = true;
      }
    }

    return proof;
  }
}
