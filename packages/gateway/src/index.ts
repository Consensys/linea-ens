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
  .option(
    "-r --l2_resolver_address <address>",
    "L2_RESOLVER_ADDRESS",
    ""
  )
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
    ""
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

console.log({l1_provider_url});
console.log({l2_provider_url}); 
console.log({l2_resolver_address});
console.log({rollup_address});
console.log({debug});
console.log({port});

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
      const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
      const node = ethers.utils.namehash(name);

      if (debug) {
        console.log("encodedName", encodedName);
        console.log("name", name);
        console.log("node", node);
        const addrSlot = ethers.utils.keccak256(node + "00".repeat(31) + "01");
        const to = request?.to;
        console.log(1, {
          node,
          to,
          data,
          l1_provider_url,
          l2_provider_url,
          l2_resolver_address,
        });
        const blockNumber = (await l2provider.getBlock("latest")).number;
        console.log(2, { blockNumber, addrSlot });
        let addressData;
        try {
          addressData = await l2provider.getStorageAt(
            l2_resolver_address,
            addrSlot
          );
        } catch (e) {
          console.log(3, { e });
        }
        console.log(4, {
          addressData,
        });
      }

      const lastBlockFinalized = await rollup.lastFinalizedBatchHeight();
      const blockNumber = lastBlockFinalized.toNumber();
      console.log(`Last block number finalized on L2 : ${blockNumber}`);
      const block = await l2provider.getBlock(blockNumber);
      const blockHash = block.hash;
      const l2blockRaw = await l2provider.send("eth_getBlockByHash", [
        blockHash,
        false,
      ]);
      console.log(5, { l2blockRaw });
      const stateRoot = l2blockRaw.stateRoot;
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

      const tokenIdSlot = ethers.utils.keccak256(node + "00".repeat(31) + "06");
      const tokenId = await l2provider.getStorageAt(
        l2_resolver_address,
        tokenIdSlot
      );
      const ownerSlot = ethers.utils.keccak256(
        tokenId + "00".repeat(31) + "02"
      );

      // Create proof for the tokenId slot
      const tokenIdProof = await l2provider.send("eth_getProof", [
        l2_resolver_address,
        [tokenIdSlot],
        { blockHash },
      ]);
      const accountProof = ethers.utils.RLP.encode(tokenIdProof.accountProof);
      const tokenIdStorageProof = ethers.utils.RLP.encode(
        (tokenIdProof.storageProof as any[]).filter(
          (x) => x.key === tokenIdSlot
        )[0].proof
      );

      // Create proof for the owner slot
      const ownerProof = await l2provider.send("eth_getProof", [
        l2_resolver_address,
        [ownerSlot],
        { blockHash },
      ]);
      const ownerStorageProof = ethers.utils.RLP.encode(
        (ownerProof.storageProof as any[]).filter((x) => x.key === ownerSlot)[0]
          .proof
      );

      const finalProof = {
        blockHash,
        encodedBlockArray,
        accountProof,
        stateRoot,
        tokenIdStorageProof,
        ownerStorageProof,
      };
      console.log(6, { finalProof });
      return [finalProof];
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
    labels.push(dnsname.slice(idx + 1, idx + len + 1).toString("utf8"));
    idx += len + 1;
  }
  return labels.join(".");
}
