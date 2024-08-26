import { AddressLike, JsonRpcProvider } from "ethers";
interface ProofStruct {
    key: string;
    leafIndex: number;
    leftLeafIndex: number | undefined;
    rightLeafIndex: number | undefined;
    proof: {
        value: string;
        proofRelatedNodes: string[];
    };
    leftProof: {
        value: string;
        proofRelatedNodes: string[];
    } | undefined;
    rightProof: {
        value: string;
        proofRelatedNodes: string[];
    } | undefined;
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
export declare class EVMProofHelper {
    private readonly providerL2;
    private readonly shomeiNode;
    constructor(providerL2: JsonRpcProvider, shomeiNode?: JsonRpcProvider);
    /**
     * @dev Returns the value of a contract state slot at the specified block
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slot The slot to fetch.
     * @returns The value in `slot` of `address` at block `block`
     */
    getStorageAt(blockNo: number, address: AddressLike, slot: bigint): Promise<string>;
    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    getProofs(blockNo: number, address: AddressLike, slots: bigint[]): Promise<StateProof>;
}
export {};
