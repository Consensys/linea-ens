import { AddressLike, JsonRpcProvider } from "ethers";
import { IProofService, StateProof } from "./evm-gateway";
export type L2ProvableBlock = number;
/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
export declare class L2ProofService implements IProofService<L2ProvableBlock> {
    private readonly rollup;
    private readonly helper;
    constructor(providerL1: JsonRpcProvider, providerL2: JsonRpcProvider, rollupAddress: string, shomeiNode?: JsonRpcProvider);
    /**
     * @dev Returns an object representing a block whose state can be proven on L1.
     */
    getProvableBlock(): Promise<number>;
    /**
     * @dev Returns the value of a contract state slot at the specified block
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slot The slot to fetch.
     * @returns The value in `slot` of `address` at block `block`
     */
    getStorageAt(block: L2ProvableBlock, address: AddressLike, slot: bigint): Promise<string>;
    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    getProofs(blockNo: L2ProvableBlock, address: AddressLike, slots: bigint[]): Promise<string>;
    /**
     * linea_getProof returns a different structure when a storage proof is
     * unitialized, to handle this case we return unitialized for this particular storage
     * @param proof
     * @returns modifier proof with the
     */
    checkStorageInitialized(proof: StateProof): StateProof;
}
