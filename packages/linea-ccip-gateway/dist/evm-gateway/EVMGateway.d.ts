import { HandlerDescription } from "@chainlink/ccip-read-server";
import { Fragment, Interface, JsonFragment } from "@ethersproject/abi";
import { IProofService, ProvableBlock } from "./IProofService";
export declare enum StorageLayout {
    /**
     * address,uint,bytes32,bool
     */
    FIXED = 0,
    /**
     * array,bytes,string
     */
    DYNAMIC = 1
}
interface Server {
    add: (abi: string | readonly (string | Fragment | JsonFragment)[] | Interface, handlers: HandlerDescription[]) => void;
}
export declare class EVMGateway<T extends ProvableBlock> {
    readonly proofService: IProofService<T>;
    constructor(proofService: IProofService<T>);
    add(server: Server): Server;
    /**
     *
     * @param address The address to fetch storage slot proofs for
     * @param paths Each element of this array specifies a Solidity-style path derivation for a storage slot ID.
     *              See README.md for details of the encoding.
     */
    createProofs(address: string, commands: string[], constants: string[]): Promise<string>;
    private executeOperation;
    private computeFirstSlot;
    private getDynamicValue;
    private getValueFromPath;
}
export {};
