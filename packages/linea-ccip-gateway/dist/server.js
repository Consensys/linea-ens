"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var evm_gateway_1 = require("./evm-gateway");
var ethers_1 = require("ethers");
var L2ProofService_1 = require("./L2ProofService");
require("dotenv/config");
var ccip_read_server_1 = require("@chainlink/ccip-read-server");
var utils_1 = require("./utils");
var l1ProviderUrl = process.env.L1_PROVIDER_URL;
var l2ProviderUrl = process.env.L2_PROVIDER_URL;
var l2ChainId = parseInt(process.env.L2_CHAIN_ID);
var rollupAddress = process.env.L1_ROLLUP_ADDRESS;
var port = process.env.PORT || 3000;
try {
    var providerL1 = new ethers_1.ethers.JsonRpcProvider(l1ProviderUrl);
    var providerL2 = new ethers_1.ethers.JsonRpcProvider(l2ProviderUrl, l2ChainId, {
        staticNetwork: true,
    });
    var gateway = new evm_gateway_1.EVMGateway(new L2ProofService_1.L2ProofService(providerL1, providerL2, rollupAddress));
    var server = new ccip_read_server_1.Server();
    gateway.add(server);
    var app_1 = server.makeApp("/");
    console.log("Server setup complete.");
    // Add a health check page
    app_1.get("/health", function (_req, res, _next) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var healthcheck;
        return tslib_1.__generator(this, function (_a) {
            healthcheck = {
                uptime: process.uptime(),
                message: "OK",
                timestamp: Date.now(),
            };
            try {
                res.send(healthcheck);
            }
            catch (error) {
                healthcheck.message = error;
                (0, utils_1.logError)(error, healthcheck);
                res.status(503).send();
            }
            return [2 /*return*/];
        });
    }); });
    (function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            app_1.listen(port, function () {
                console.log("Listening on ".concat(port));
            });
            return [2 /*return*/];
        });
    }); })();
}
catch (e) {
    (0, utils_1.logError)(e, { l1ProviderUrl: l1ProviderUrl, l2ProviderUrl: l2ProviderUrl, l2ChainId: l2ChainId, rollupAddress: rollupAddress, port: port });
}
//# sourceMappingURL=server.js.map