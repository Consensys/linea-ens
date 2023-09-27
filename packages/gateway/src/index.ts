import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers } from "ethers";
import { Result } from "ethers/lib/utils";
import { createLogger, format, transports } from "winston";

const IResolverAbi = require("../abi/IResolverService.json").abi;
const rollupAbi = require("../abi/rollup.json");
require("dotenv").config();
const { BigNumber } = ethers;
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
    "0xE87d317eB8dcc9afE24d9f63D6C760e52Bc18A40"
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
        logger.info({ lastBlockFinalized });
        logger.info({ lastBlockFinalized: lastBlockFinalized.toString() });
        const blockNumber = lastBlockFinalized.toNumber();
        const block = await l2provider.getBlock(blockNumber);
        const blockHash = block.hash;
        const l2blockRaw = await l2provider.send("eth_getBlockByHash", [
          blockHash,
          false,
        ]);
        const stateRoot = l2blockRaw.stateRoot;
        logger.info({ stateRoot });
        const blockarray = [
          l2blockRaw.parentHash,
          l2blockRaw.sha3Uncles,
          l2blockRaw.miner,
          l2blockRaw.stateRoot,
          l2blockRaw.transactionsRoot,
          l2blockRaw.receiptsRoot,
          l2blockRaw.logsBloom,
          BigNumber.from(l2blockRaw.difficulty).toHexString(),
          BigNumber.from(l2blockRaw.number).toHexString(),
          BigNumber.from(l2blockRaw.gasLimit).toHexString(),
          BigNumber.from(l2blockRaw.gasUsed).toHexString(),
          BigNumber.from(l2blockRaw.timestamp).toHexString(),
          l2blockRaw.extraData,
          l2blockRaw.mixHash,
          l2blockRaw.nonce,
          BigNumber.from(l2blockRaw.baseFeePerGas).toHexString(),
        ];
        const encodedBlockArray = ethers.utils.RLP.encode(blockarray);

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

        const tokenIdProof = await l2provider.send("eth_getProof", [
          l2_resolver_address,
          [tokenIdSlot],
          { blockHash },
        ]);
        const accountProof = ethers.utils.RLP.encode(tokenIdProof.accountProof);
        const tokenIdStorageProof = ethers.utils.RLP.encode(
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          (tokenIdProof.storageProof as any[]).filter(
            (x) => x.key === tokenIdSlot
          )[0].proof
        );
        const slicedTokenIdStorageProof = tokenIdStorageProof.slice(0, 50);
        logger.info({ tokenIdStorageProof: slicedTokenIdStorageProof });

        const ownerProof = await l2provider.send("eth_getProof", [
          l2_resolver_address,
          [ownerSlot],
          { blockHash },
        ]);

        console.log({ ownerProof });
        console.log({ test: ownerProof.storageProof });
        const ownerStorageProof = ethers.utils.RLP.encode(
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          (ownerProof.storageProof as any[]).filter(
            (x) => x.key === ownerSlot
          )[0].proof
        );
        const slicedOwnerStorageProof = ownerStorageProof.slice(0, 50);
        logger.info({ ownerStorageProof: slicedOwnerStorageProof });

        const finalProof = {
          blockHash,
          encodedBlockArray,
          accountProof,
          stateRoot,
          tokenIdStorageProof,
          ownerStorageProof,
          l2blockNumber: blockNumber,
        };
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
