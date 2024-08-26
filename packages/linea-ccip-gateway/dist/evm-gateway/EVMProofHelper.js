"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMProofHelper = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var utils_1 = require("../utils");
/**
 * The proofService class can be used to calculate proofs for a given target and slot on the Optimism Bedrock network.
 * It's also capable of proofing long types such as mappings or string by using all included slots in the proof.
 *
 */
var EVMProofHelper = /** @class */ (function () {
    function EVMProofHelper(providerL2, shomeiNode) {
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
    EVMProofHelper.prototype.getStorageAt = function (blockNo, address, slot) {
        return this.providerL2.getStorage(address, slot, blockNo);
    };
    /**
     * @dev Fetches a set of proofs for the requested state slots.
     * @param block A `ProvableBlock` returned by `getProvableBlock`.
     * @param address The address of the contract to fetch data from.
     * @param slots An array of slots to fetch data for.
     * @returns A proof of the given slots, encoded in a manner that this service's
     *   corresponding decoding library will understand.
     */
    EVMProofHelper.prototype.getProofs = function (blockNo, address, slots) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var args, providerUrl, providerChainId, providerL2, proofs;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        args = [
                            address,
                            slots.map(function (slot) { return (0, ethers_1.toBeHex)(slot, 32); }),
                            "0x" + blockNo.toString(16),
                        ];
                        (0, utils_1.logInfo)("Calling linea_getProof with args", args);
                        return [4 /*yield*/, this.shomeiNode._getConnection().url];
                    case 1:
                        providerUrl = _a.sent();
                        return [4 /*yield*/, this.shomeiNode._network.chainId];
                    case 2:
                        providerChainId = _a.sent();
                        providerL2 = new ethers_1.ethers.JsonRpcProvider(providerUrl, providerChainId, {
                            staticNetwork: true,
                        });
                        (0, utils_1.logDebug)("Calling linea_getProof with L2 provider", providerUrl);
                        return [4 /*yield*/, providerL2.send("linea_getProof", args)];
                    case 3:
                        proofs = _a.sent();
                        (0, utils_1.logDebug)("Proof result", proofs);
                        return [2 /*return*/, proofs];
                }
            });
        });
    };
    return EVMProofHelper;
}());
exports.EVMProofHelper = EVMProofHelper;
//# sourceMappingURL=EVMProofHelper.js.map