"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.L2ProofService = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var evm_gateway_1 = require("./evm-gateway");
var utils_1 = require("./utils");
var currentL2BlockNumberSig = "function currentL2BlockNumber() view returns (uint256)";
/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
var L2ProofService = /** @class */ (function () {
    function L2ProofService(providerL1, providerL2, rollupAddress, shomeiNode) {
        this.helper = new evm_gateway_1.EVMProofHelper(providerL2, shomeiNode);
        var currentL2BlockNumberIface = new ethers_1.ethers.Interface([
            currentL2BlockNumberSig,
        ]);
        this.rollup = new ethers_1.Contract(rollupAddress, currentL2BlockNumberIface, providerL1);
    }
    /**
     * @dev Returns an object representing a block whose state can be proven on L1.
     */
    L2ProofService.prototype.getProvableBlock = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, lastBlockFinalized, e_1;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        _a = utils_1.logDebug;
                        _b = ["Calling currentL2BlockNumber() on Rollup Contract"];
                        return [4 /*yield*/, this.rollup.getAddress()];
                    case 1:
                        _a.apply(void 0, _b.concat([_c.sent()]));
                        return [4 /*yield*/, this.rollup.currentL2BlockNumber({
                                blockTag: "finalized",
                            })];
                    case 2:
                        lastBlockFinalized = _c.sent();
                        if (!lastBlockFinalized)
                            throw new Error("No block found");
                        (0, utils_1.logDebug)("Provable block found", lastBlockFinalized);
                        return [2 /*return*/, lastBlockFinalized];
                    case 3:
                        e_1 = _c.sent();
                        (0, utils_1.logError)(e_1);
                        throw e_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @dev Returns the value of a contract state slot at the specified block
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slot The slot to fetch.
     * @returns The value in `slot` of `address` at block `block`
     */
    L2ProofService.prototype.getStorageAt = function (block, address, slot) {
        try {
            return this.helper.getStorageAt(block, address, slot);
        }
        catch (e) {
            (0, utils_1.logError)(e, { block: block, address: address, slot: slot });
            throw e;
        }
    };
    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    L2ProofService.prototype.getProofs = function (blockNo, address, slots) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var proof, e_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.helper.getProofs(blockNo, address, slots)];
                    case 1:
                        proof = _a.sent();
                        if (!proof.accountProof) {
                            throw "No account proof on contract ".concat(address, " for block number ").concat(blockNo);
                        }
                        if (proof.storageProofs.length === 0) {
                            throw "No storage proofs on contract ".concat(address, " for block number ").concat(blockNo);
                        }
                        proof = this.checkStorageInitialized(proof);
                        return [2 /*return*/, ethers_1.AbiCoder.defaultAbiCoder().encode([
                                "uint256",
                                "tuple(bytes key, uint256 leafIndex, tuple(bytes value, bytes[] proofRelatedNodes) proof)",
                                "tuple(bytes32 key, uint256 leafIndex, tuple(bytes32 value, bytes[] proofRelatedNodes) proof, bool initialized)[]",
                            ], [blockNo, proof.accountProof, proof.storageProofs])];
                    case 2:
                        e_2 = _a.sent();
                        (0, utils_1.logError)(e_2, { blockNo: blockNo, address: address, slots: slots });
                        throw e_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * linea_getProof returns a different structure when a storage proof is
     * unitialized, to handle this case we return unitialized for this particular storage
     * @param proof
     * @returns modifier proof with the
     */
    L2ProofService.prototype.checkStorageInitialized = function (proof) {
        for (var _i = 0, _a = proof.storageProofs; _i < _a.length; _i++) {
            var storageProof = _a[_i];
            if (storageProof.leftProof || storageProof.rightProof) {
                storageProof.proof = storageProof.leftProof;
                storageProof.leafIndex = storageProof.leftLeafIndex;
                storageProof.initialized = false;
                delete storageProof.leftProof;
                delete storageProof.rightProof;
                delete storageProof.leftLeafIndex;
                delete storageProof.rightLeafIndex;
            }
            else {
                storageProof.initialized = true;
            }
        }
        return proof;
    };
    return L2ProofService;
}());
exports.L2ProofService = L2ProofService;
//# sourceMappingURL=L2ProofService.js.map