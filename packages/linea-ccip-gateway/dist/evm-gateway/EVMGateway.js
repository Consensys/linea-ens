"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMGateway = exports.StorageLayout = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var utils_1 = require("../utils");
var OP_CONSTANT = 0x00;
var OP_BACKREF = 0x20;
var StorageLayout;
(function (StorageLayout) {
    /**
     * address,uint,bytes32,bool
     */
    StorageLayout[StorageLayout["FIXED"] = 0] = "FIXED";
    /**
     * array,bytes,string
     */
    StorageLayout[StorageLayout["DYNAMIC"] = 1] = "DYNAMIC";
})(StorageLayout || (exports.StorageLayout = StorageLayout = {}));
function memoize(fn) {
    var promise;
    return function () {
        if (!promise) {
            promise = fn();
        }
        return promise;
    };
}
var EVMGateway = /** @class */ (function () {
    function EVMGateway(proofService) {
        this.proofService = proofService;
    }
    EVMGateway.prototype.add = function (server) {
        var _this = this;
        var abi = [
            /**
             * This function implements a simple VM for fetching proofs for EVM contract storage data.
             * Programs consist of an array of `commands` and an array of `constants`. Each `command` is a
             * short program that computes the slot number of a single EVM storage value. The gateway then
             * returns a proof of a value at that slot number. Commands can also specify that the value is
             * dynamic-length, in which case the gateway may return proofs for multiple slots in order for
             * the caller to be able to reconstruct the entire value.
             *
             * Each command is a 32 byte value consisting of a single flags byte, followed by 31 instruction
             * bytes. Valid flags are:
             *  - 0x01 - If set, the value to be returned is dynamic length.
             *
             * The VM implements a very simple stack machine, and instructions specify operations that happen on
             * the stack. In addition, the VM has access to the result of previous commands, referred to here
             * as `values`.
             *
             * The most significant 3 bits of each instruction byte are the opcode, and the least significant
             * 5 bits are the operand. The following opcodes are defined:
             *  - 0x00 - `push(constants[operand])`
             *  - 0x20 - `push(values[operand])`
             *  - 0x70 - `halt` - do not process any further instructions for this command.
             *
             * After a `halt` is reached or the end of the command word is reached, the elements on the stack
             * are hashed recursively, starting with the first element pushed, using a process equivalent
             * to the following:
             *   def hashStack(stack):
             *     right = stack.pop()
             *     if(stack.empty()):
             *       return right
             *     return keccak256(concat(hashStack(stack), right))
             *
             * The final result of this hashing operation is used as the base slot number for the storage
             * lookup. This mirrors Solidity's recursive hashing operation for determining storage slot locations.
             */
            "function getStorageSlots(address addr, bytes32[] memory commands, bytes[] memory constants) external view returns(bytes memory witness)",
        ];
        server.add(abi, [
            {
                type: "getStorageSlots",
                func: function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var addr, commands, constants, proofs, e_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                addr = args[0], commands = args[1], constants = args[2];
                                (0, utils_1.logInfo)("CCIP request started for L2 target contract", {
                                    address: addr,
                                });
                                (0, utils_1.logDebug)("CCIP request started with args", addr, commands, constants);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, this.createProofs(addr, commands, constants)];
                            case 2:
                                proofs = _a.sent();
                                (0, utils_1.logInfo)("CCIP request successfully executed for L2 target contract", {
                                    address: addr,
                                });
                                (0, utils_1.logDebug)("CCIP request finished with encoded proofs", proofs);
                                return [2 /*return*/, [proofs]];
                            case 3:
                                e_1 = _a.sent();
                                (0, utils_1.logError)(e_1, { addr: addr, commands: commands, constants: constants });
                                throw "ccip-gateway error calling getStorageSlots";
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
            },
        ]);
        return server;
    };
    /**
     *
     * @param address The address to fetch storage slot proofs for
     * @param paths Each element of this array specifies a Solidity-style path derivation for a storage slot ID.
     *              See README.md for details of the encoding.
     */
    EVMGateway.prototype.createProofs = function (address, commands, constants) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var block, requests, i, results, slots;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.proofService.getProvableBlock()];
                    case 1:
                        block = _b.sent();
                        requests = [];
                        // For each request, spawn a promise to compute the set of slots required
                        for (i = 0; i < commands.length; i++) {
                            requests.push(this.getValueFromPath(block, address, commands[i], constants, requests.slice()));
                        }
                        return [4 /*yield*/, Promise.all(requests)];
                    case 2:
                        results = _b.sent();
                        slots = (_a = Array.prototype).concat.apply(_a, results.map(function (result) { return result.slots; }));
                        return [2 /*return*/, this.proofService.getProofs(block, address, slots)];
                }
            });
        });
    };
    EVMGateway.prototype.executeOperation = function (operation, constants, requests) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var opcode, operand, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        opcode = operation & 0xe0;
                        operand = operation & 0x1f;
                        _a = opcode;
                        switch (_a) {
                            case OP_CONSTANT: return [3 /*break*/, 1];
                            case OP_BACKREF: return [3 /*break*/, 2];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [2 /*return*/, constants[operand]];
                    case 2: return [4 /*yield*/, requests[operand]];
                    case 3: return [4 /*yield*/, (_b.sent()).value()];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: throw new Error("Unrecognized opcode");
                }
            });
        });
    };
    EVMGateway.prototype.computeFirstSlot = function (command, constants, requests) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var commandWord, flags, isDynamic, slot, _a, j, index;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        commandWord = (0, ethers_1.getBytes)(command);
                        flags = commandWord[0];
                        isDynamic = (flags & 0x01) != 0;
                        _a = ethers_1.toBigInt;
                        return [4 /*yield*/, this.executeOperation(commandWord[1], constants, requests)];
                    case 1:
                        slot = _a.apply(void 0, [_b.sent()]);
                        j = 2;
                        _b.label = 2;
                    case 2:
                        if (!(j < 32 && commandWord[j] != 0xff)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.executeOperation(commandWord[j], constants, requests)];
                    case 3:
                        index = _b.sent();
                        slot = (0, ethers_1.toBigInt)((0, ethers_1.solidityPackedKeccak256)(["bytes", "uint256"], [index, slot]));
                        _b.label = 4;
                    case 4:
                        j++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, { slot: slot, isDynamic: isDynamic }];
                }
            });
        });
    };
    EVMGateway.prototype.getDynamicValue = function (block, address, slot) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var firstValue, _a, len_1, hashedSlot, slotNumbers_1, len_2;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = ethers_1.getBytes;
                        return [4 /*yield*/, this.proofService.getStorageAt(block, address, slot)];
                    case 1:
                        firstValue = _a.apply(void 0, [_b.sent()]);
                        // Decode Solidity dynamic value encoding
                        if (firstValue[31] & 0x01) {
                            len_1 = (Number((0, ethers_1.toBigInt)(firstValue)) - 1) / 2;
                            hashedSlot = (0, ethers_1.toBigInt)((0, ethers_1.solidityPackedKeccak256)(["uint256"], [slot]));
                            slotNumbers_1 = Array(Math.ceil(len_1 / 32))
                                .fill(BigInt(hashedSlot))
                                .map(function (i, idx) { return i + BigInt(idx); });
                            return [2 /*return*/, {
                                    slots: Array.prototype.concat([slot], slotNumbers_1),
                                    isDynamic: true,
                                    value: memoize(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var values;
                                        var _this = this;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4 /*yield*/, Promise.all(slotNumbers_1.map(function (slot) {
                                                        return _this.proofService.getStorageAt(block, address, slot);
                                                    }))];
                                                case 1:
                                                    values = _a.sent();
                                                    return [2 /*return*/, (0, ethers_1.dataSlice)((0, ethers_1.concat)(values), 0, len_1)];
                                            }
                                        });
                                    }); }),
                                }];
                        }
                        else {
                            len_2 = firstValue[31] / 2;
                            return [2 /*return*/, {
                                    slots: [slot],
                                    isDynamic: true,
                                    value: function () { return Promise.resolve((0, ethers_1.dataSlice)(firstValue, 0, len_2)); },
                                }];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    EVMGateway.prototype.getValueFromPath = function (block, address, command, constants, requests) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, slot, isDynamic;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.computeFirstSlot(command, constants, requests)];
                    case 1:
                        _a = _b.sent(), slot = _a.slot, isDynamic = _a.isDynamic;
                        if (!isDynamic) {
                            return [2 /*return*/, {
                                    slots: [slot],
                                    isDynamic: isDynamic,
                                    value: memoize(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var _a;
                                        return tslib_1.__generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _a = ethers_1.zeroPadValue;
                                                    return [4 /*yield*/, this.proofService.getStorageAt(block, address, slot)];
                                                case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent(), 32])];
                                            }
                                        });
                                    }); }),
                                }];
                        }
                        else {
                            return [2 /*return*/, this.getDynamicValue(block, address, slot)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return EVMGateway;
}());
exports.EVMGateway = EVMGateway;
//# sourceMappingURL=EVMGateway.js.map