import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { EVMGateway } from "./evm-gateway";
import { ethers } from "ethers";
import { L2ProofService } from "./L2ProofService";
import "dotenv/config";

const program = new Command()
  .option("-p, --port <port>", "PORT", "8080")
  .option(
    "-l1p --l1_provider_url <url1>",
    "L1_PROVIDER_URL",
    "http://127.0.0.1:8545/"
  )
  .option(
    "-l2p --l2_provider_url <url2>",
    "L2_PROVIDER_URL",
    "http://127.0.0.1:8545/"
  )
  .option(
    "-ru --rollup_address <rollup_address>",
    "ROLLUP_ADDRESS",
    "0x70BaD09280FD342D02fe64119779BC1f0791BAC2"
  );

program.parse(process.argv);
const options = program.opts();

const l1ProviderUrl = process.env.L1_PROVIDER_URL || options.l1_provider_url;
const l2ProviderUrl = process.env.L2_PROVIDER_URL || options.l2_provider_url;
const rollupAddress = process.env.ROLLUP_ADDRESS || options.rollup_address;
const port = process.env.PORT || options.port;

const providerL1 = new ethers.JsonRpcProvider(l1ProviderUrl);
const providerL2 = new ethers.JsonRpcProvider(l2ProviderUrl, 59140, {
  staticNetwork: true,
});
const gateway = new EVMGateway(
  new L2ProofService(providerL1, providerL2, rollupAddress)
);
const server = new Server();
gateway.add(server);
const app = server.makeApp("/");

(async () => {
  app.listen(port, function () {
    console.log(`Listening on ${port}`);
  });
})();
