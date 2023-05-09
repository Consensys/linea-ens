import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers } from "ethers";
import { Result } from "ethers/lib/utils";

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
  .option("-d --debug", "debug", false)
  .option("-p --port <number>", "Port number to serve on", "8080");
program.parse(process.argv);
const options = program.opts();

const l1_provider_url = process.env.L1_PROVIDER_URL || options.l1_provider_url;
const l2_provider_url = process.env.L2_PROVIDER_URL || options.l2_provider_url;
const l2_resolver_address =
  process.env.L2_RESOLVER_ADDRESS || options.l2_resolver_address;

const { rollup_address, debug, port } = options;

console.log({
  l1_provider_url,
  l2_provider_url,
  l2_resolver_address,
  rollup_address,
  debug,
  port,
});

if (l2_resolver_address === undefined) {
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
        console.log("--------------------REQUEST START--------------------\n");
        console.log(`Request timestamp: ${new Date().toUTCString()}`);
        const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
        const node = ethers.utils.namehash(name);

        if (debug) {
          console.log({
            encodedName,
            name,
            node,
          });
          const to = request?.to;
          console.log({
            node,
            to,
            data,
            l1_provider_url,
            l2_provider_url,
            l2_resolver_address,
          });
        }

        const lastBlockFinalized = await rollup.lastFinalizedBatchHeight();
        console.log({ lastBlockFinalized });
        const blockNumber = lastBlockFinalized.toNumber();
        const block = await l2provider.getBlock(blockNumber);
        const blockHash = block.hash;
        const l2blockRaw = await l2provider.send("eth_getBlockByHash", [
          blockHash,
          false,
        ]);
        const stateRoot = l2blockRaw.stateRoot;
        console.log({ stateRoot });
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

        // we get the slot address of the variable 'mapping(bytes32 => uint256) public addresses'
        // which is at index 11 of the L2 resolver contract
        const tokenIdSlot = ethers.utils.keccak256(
          `${node}${"00".repeat(31)}0B`
        );
        const tokenId = await l2provider.getStorageAt(
          l2_resolver_address,
          tokenIdSlot
        );
        console.log({ tokenId: stateRoot });
        const ownerSlot = ethers.utils.keccak256(
          `${tokenId}${"00".repeat(31)}02`
        );

        // Create proof for the tokenId slot
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
        console.log({ tokenIdStorageProof: slicedTokenIdStorageProof });

        // Create proof for the owner slot
        const ownerProof = await l2provider.send("eth_getProof", [
          l2_resolver_address,
          [ownerSlot],
          { blockHash },
        ]);
        const ownerStorageProof = ethers.utils.RLP.encode(
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          (ownerProof.storageProof as any[]).filter(
            (x) => x.key === ownerSlot
          )[0].proof
        );
        const slicedOwnerStorageProof = ownerStorageProof.slice(0, 50);
        console.log({ ownerStorageProof: slicedOwnerStorageProof });

        const finalProof = {
          blockHash,
          encodedBlockArray,
          accountProof,
          stateRoot,
          tokenIdStorageProof,
          ownerStorageProof,
        };
        console.log("\n--------------------REQUEST END--------------------\n");
        return [finalProof];
      } catch (error) {
        console.log(`Error occured: ${error}`);
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
