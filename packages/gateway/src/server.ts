import { EVMGateway } from "./evm-gateway";
import { ethers } from "ethers";
import { L2ProofService } from "./L2ProofService";
import "dotenv/config";
import { Server } from "./ccip-server";

const l1ProviderUrl = process.env.L1_PROVIDER_URL;
const l2ProviderUrl = process.env.L2_PROVIDER_URL;
const l2ChainId = parseInt(process.env.L2_CHAIN_ID);
const rollupAddress = process.env.L1_ROLLUP_ADDRESS;
const port = process.env.PORT || 3000;

console.log("L1 Provider URL:", l1ProviderUrl);
console.log("L2 Provider URL:", l2ProviderUrl);
console.log("L2 Chain ID:", l2ChainId);
console.log("Rollup Address:", rollupAddress);

const providerL1 = new ethers.JsonRpcProvider(l1ProviderUrl);
const providerL2 = new ethers.JsonRpcProvider(l2ProviderUrl, l2ChainId, {
  staticNetwork: true,
});

console.log("Provider L1 JSON:", JSON.stringify(providerL1, null, 2));
console.log("Provider L2 JSON:", JSON.stringify(providerL2, null, 2));

const gateway = new EVMGateway(
  new L2ProofService(providerL1, providerL2, rollupAddress)
);

const server = new Server();
gateway.add(server);
const app = server.makeApp("/");

console.log("Server setup complete.");

// Add a health check page
app.get("/health", async (_req, res, _next) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  };
  console.log("Health check JSON:", JSON.stringify(healthcheck, null, 2));
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    console.log(
      "Health check error JSON:",
      JSON.stringify(healthcheck, null, 2)
    );
    res.status(503).send();
  }
});

(async () => {
  app.listen(port, function () {
    console.log(`Listening on ${port}`);
  });
})();
