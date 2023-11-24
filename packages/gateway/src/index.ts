import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers } from "ethers";
import { Result } from "ethers/lib/utils";
import { createLogger, format, transports } from "winston";

const IResolverAbi = require("../abi/IResolverService.json").abi;
const rollupAbi = require("../abi/rollup.json");

require("dotenv").config();
const program = new Command();

program
  .option("-r --l2_resolver_address <address>", "L2_RESOLVER_ADDRESS", "")
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
  )
  .option("-d --debug", "debug")
  .option("-p --port <number>", "Port number to serve on", "8080");

program.parse(process.argv);
const options = program.opts();
options.debug = options.debug || false;

const l1_provider_url = process.env.L1_PROVIDER_URL || options.l1_provider_url;
const l2_provider_url = process.env.L2_PROVIDER_URL || options.l2_provider_url;
const l2_resolver_address =
  process.env.L2_RESOLVER_ADDRESS || options.l2_resolver_address;

const rollup_address = process.env.ROLLUP_ADDRESS || options.rollup_address;

const { debug, port } = options;

const logger = createLogger({
  level: debug ? "debug" : "info",
  format: format.json(),
  defaultMeta: { service: "ens-gateway" },
  transports: [new transports.Console()],
});

logger.info({
  l1_provider_url,
  l2_provider_url,
  l2_resolver_address,
  rollup_address,
  debug,
  port,
});

if (l2_resolver_address === undefined) {
  logger.error({ error: "Must specify --l2_resolver_address" });
  throw "Must specify --l2_resolver_address";
}

const l1provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
const l2provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
const rollup = new ethers.Contract(rollup_address, rollupAbi, l1provider);
const server = new Server();

server.add(IResolverAbi, [
  {
    type: "resolve",
    func: async ([encodedName, data]: Result, request) => {
      try {
        const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
        const node = ethers.utils.namehash(name);

        if (debug) {
          logger.debug({
            encodedName,
            name,
            node,
          });

          const to = request?.to;
          logger.debug({
            node,
            to,
            data,
            l1_provider_url,
            l2_provider_url,
            l2_resolver_address,
          });
        }

        const lastBlockFinalized = await rollup.currentL2BlockNumber();
        const blockNumber = lastBlockFinalized.toNumber();
        const blockNumberHex = "0x" + blockNumber.toString(16);

        const tokenIdSlot = ethers.utils.keccak256(
          `${node}${"00".repeat(31)}FB`
        );
        const tokenId = await l2provider.getStorageAt(
          l2_resolver_address,
          tokenIdSlot
        );
        logger.info({ tokenId });

        const ownerSlot = ethers.utils.keccak256(
          `${tokenId}${"00".repeat(31)}67`
        );

        console.log({ l2_resolver_address });
        console.log({ tokenIdSlot });
        console.log({ ownerSlot });

        const testProof = await l2provider.send("rollup_getProof", [
          l2_resolver_address,
          [tokenIdSlot, ownerSlot],
          blockNumberHex,
        ]);

        const finalProof = {
          accountProof: testProof.accountProof.proof.proofRelatedNodes,
          tokenIdProof: testProof.storageProofs[0].proof.proofRelatedNodes,
          addressProof: testProof.storageProofs[1].proof.proofRelatedNodes,
          accountLeafIndex: testProof.accountProof.leafIndex,
          tokenIdLeafIndex: testProof.storageProofs[0].leafIndex,
          addressLeafIndex: testProof.storageProofs[1].leafIndex,
          accountValue: testProof.accountProof.proof.value,
          tokenIdValue: testProof.storageProofs[0].proof.value,
          addressValue: testProof.storageProofs[1].proof.value,
          l2blockNumber: blockNumber,
        };

        console.log({
          finalProof,
        });
        return [finalProof];
      } catch (error) {
        logger.error({ error });
        throw error;
      }
    },
  },
]);
const app = server.makeApp("/");
app.listen(options.port);

function decodeDnsName(dnsname: Buffer) {
  const labels = [];
  let idx = 0;
  while (true) {
    const len = dnsname.readUInt8(idx);
    if (len === 0) break;
    labels.push(dnsname.subarray(idx + 1, idx + len + 1).toString("utf8"));
    idx += len + 1;
  }
  return labels.join(".");
}
