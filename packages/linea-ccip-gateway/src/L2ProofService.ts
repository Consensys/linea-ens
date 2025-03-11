import {
  AbiCoder,
  AddressLike,
  Contract,
  ethers,
  FallbackProvider,
} from 'ethers';
import { EVMProofHelper, IProofService, StateProof } from './evm-gateway';
import { logDebug, logError } from './utils';

export type L2ProvableBlock = number;

const FINALIZED_TAG = 'finalized';
const BLOCK_BUFFER = 3;
const currentL2BlockNumberSig =
  'function currentL2BlockNumber() view returns (uint256)';

/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export class L2ProofService implements IProofService<L2ProvableBlock> {
  private readonly rollup: Contract;
  private readonly helper: EVMProofHelper;
  private readonly providerL1: FallbackProvider;

  constructor(
    providerL1: FallbackProvider,
    providerL2: FallbackProvider,
    rollupAddress: string,
  ) {
    this.providerL1 = providerL1;
    this.helper = new EVMProofHelper(providerL2);
    const currentL2BlockNumberIface = new ethers.Interface([
      currentL2BlockNumberSig,
    ]);
    this.rollup = new Contract(
      rollupAddress,
      currentL2BlockNumberIface,
      providerL1,
    );
  }

  /**
   * @dev Returns the latest finalized L2 block that can be proven on L1.
   * Applies a buffer to ensure the block's state is fully anchored and available.
   *
   * @returns The L2 block number that is safe to use for proof submission.
   */
  async getProvableBlock(): Promise<number> {
    logDebug(
      'Calling currentL2BlockNumber() on Rollup Contract',
      await this.rollup.getAddress(),
    );

    const block = await this.providerL1.getBlock(FINALIZED_TAG);

    if (!block) {
      const error = new Error('No finalized block found on L1');
      logError(error);
      return Promise.reject(error);
    }

    const lastBlockFinalized = await this.rollup.currentL2BlockNumber({
      blockTag: block.number - BLOCK_BUFFER,
    });

    if (!lastBlockFinalized) {
      logError('No block found');
      return Promise.reject(new Error('No block found'));
    }

    logDebug('Provable block found', lastBlockFinalized);
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
    slot: bigint,
  ): Promise<string> {
    try {
      return this.helper.getStorageAt(block, address, slot);
    } catch (e) {
      logError(e, { block, address, slot });
      throw e;
    }
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
    blockNo: L2ProvableBlock,
    address: AddressLike,
    slots: bigint[],
  ): Promise<string> {
    try {
      const proof = await this.helper.getProofs(blockNo, address, slots);

      if (!proof.accountProof) {
        const error = `No account proof on contract ${address} for block number ${blockNo}`;
        logError(error, { blockNo, address, slots });
        return Promise.reject(new Error(error));
      }

      if (proof.storageProofs.length === 0) {
        const error = `No storage proofs on contract ${address} for block number ${blockNo}`;
        logError(error, { blockNo, address, slots });
        return Promise.reject(new Error(error));
      }

      const verifiedProof = this.checkStorageInitialized(proof);

      return AbiCoder.defaultAbiCoder().encode(
        [
          'uint256',
          'tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)',
          'tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]',
        ],
        [blockNo, verifiedProof.accountProof, verifiedProof.storageProofs],
      );
    } catch (e) {
      logError(e, { blockNo, address, slots });
      return Promise.reject(e);
    }
  }

  /**
   * linea_getProof returns a different structure when a storage proof is
   * unitialized, to handle this case we return unitialized for this particular storage
   * @param proof
   * @returns modifier proof with the
   */
  checkStorageInitialized(proof: StateProof): StateProof {
    for (const storageProof of proof.storageProofs) {
      if (storageProof.leftProof || storageProof.rightProof) {
        if (
          storageProof.leftProof &&
          storageProof.leftLeafIndex !== undefined
        ) {
          storageProof.proof = storageProof.leftProof;
          storageProof.leafIndex = storageProof.leftLeafIndex;
          storageProof.initialized = false;
          delete storageProof.leftProof;
          delete storageProof.rightProof;
          delete storageProof.leftLeafIndex;
          delete storageProof.rightLeafIndex;
        } else {
          throw new Error('Left proof or left leaf index is undefined');
        }
      } else {
        storageProof.initialized = true;
      }
    }

    return proof;
  }
}
