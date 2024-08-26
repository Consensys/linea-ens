"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.L2ProofService = exports.makeL2Gateway = void 0;
var evm_gateway_1 = require("./evm-gateway");
var L2ProofService_1 = require("./L2ProofService");
Object.defineProperty(exports, "L2ProofService", { enumerable: true, get: function () { return L2ProofService_1.L2ProofService; } });
function makeL2Gateway(providerL1, providerL2, rollupAddress, shomeiNode) {
    return new evm_gateway_1.EVMGateway(new L2ProofService_1.L2ProofService(providerL1, providerL2, rollupAddress, shomeiNode));
}
exports.makeL2Gateway = makeL2Gateway;
//# sourceMappingURL=index.js.map