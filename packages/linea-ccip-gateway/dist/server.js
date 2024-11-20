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
var nodeEnv = process.env.NODE_ENV || "test";
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
        var healthcheck, host, urlToCheck, check, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    healthcheck = {
                        uptime: process.uptime(),
                        message: "OK",
                        timestamp: Date.now(),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    host = _req.protocol + "://" + _req.get("host");
                    console.log("host", host);
                    urlToCheck = "".concat(host, "/0xde16ee87b0c019499cebdde29c9f7686560f679a/0xea9cd3bf00000000000000000000000086c5aed9f27837074612288610fb98ccc1733126000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000001ff000000000000000000000000000000000000000000000000000000000102200304ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020a6b048e995adeec31455b4128a77bb8c173bd1314c7c99ab5e09622ee28be2f0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020a6b048e995adeec31455b4128a77bb8c173bd1314c7c99ab5e09622ee28be2f00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003c.json");
                    if (nodeEnv === "test") {
                        // If on sepolia the values are slightly different
                        // Query to retreive the address of "test.linea-sepolia.eth" using the sepolia linea ccip gateway
                        urlToCheck = "".concat(host, "/0x64884ed06241c059497aedb2c7a44ccae6bc7937/0xea9cd3bf000000000000000000000000a2008916ed2d7ed0ecd747a8a5309267e42cf1f1000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000002000001ff000000000000000000000000000000000000000000000000000000000102200304ff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020dde5d7fdc926e668bfdf1fa738b96e0ad0267b06f38e6709478a00dbc5243c17000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000020dde5d7fdc926e668bfdf1fa738b96e0ad0267b06f38e6709478a00dbc5243c170000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003c.json");
                    }
                    return [4 /*yield*/, fetch(urlToCheck)];
                case 2:
                    check = _a.sent();
                    if (check.status != 200) {
                        healthcheck.message = check.statusText;
                        (0, utils_1.logError)(healthcheck);
                        res.status(check.status).send();
                    }
                    else {
                        res.send(healthcheck);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    healthcheck.message = error_1;
                    (0, utils_1.logError)(error_1, healthcheck);
                    res.status(500).send();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
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