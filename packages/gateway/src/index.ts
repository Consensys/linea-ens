import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers } from "ethers";

const IResolverAbi = require("../abi/IResolverService.json").abi;
const rollupAbi = require("../abi/rollup.json");
const { BigNumber } = ethers;
const program = new Command();
program
  .option("-r --l2_resolver_address <address>", "RESOLVER_ADDRESS")
  .option(
    "-l1p --l1_provider_url <url1>",
    "L1_PROVIDER_URL",
    "http://127.0.0.1:8545/"
  )
  .option(
    "-l2p --l2_provider_url <url2>",
    "L2_PROVIDER_URL",
    "https://consensys-zkevm-goerli-prealpha.infura.io/v3/16fff764ff2145c2b137fbe8013730c6"
  )
  .option("-l1c --l1_chain_id <chain1>", "L1_CHAIN_ID", "5")
  .option("-l2c --l2_chain_id <chain2>", "L2_CHAIN_ID", "59140")
  .option(
    "-ru --rollup_address <rollup_address>",
    "ROLLUP_ADDRESS",
    "0xE87d317eB8dcc9afE24d9f63D6C760e52Bc18A40"
  )
  .option("-d --debug", "debug", false)
  .option("-p --port <number>", "Port number to serve on", "8080");
program.parse(process.argv);
const options = program.opts();
console.log({ options });
const {
  l1_provider_url,
  l2_provider_url,
  rollup_address,
  l2_resolver_address,
  l1_chain_id,
  l2_chain_id,
  debug,
} = options;
if (l2_resolver_address === undefined) {
  throw "Must specify --l2_resolver_address";
}

const l1provider = new ethers.providers.JsonRpcProvider(l1_provider_url);
const l2provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
const rollup = new ethers.Contract(rollup_address, rollupAbi, l1provider);
const server = new Server();

server.add(IResolverAbi, [
  {
    type: "addr(bytes32)",
    func: async ([node], { to, data: _callData }) => {
      const addrSlot = ethers.utils.keccak256(node + "00".repeat(31) + "01");

      if (debug) {
        console.log(1, {
          node,
          to,
          _callData,
          l1_provider_url,
          l2_provider_url,
          l2_resolver_address,
          l1_chain_id,
          l2_chain_id,
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
      // const nodeIndex = await rollup.lastFinalizedStateRootHash();
      // console.log({
      //   nodeIndex: nodeIndex.toString(),
      // });
      // const nodeEventFilter = await rollup.filters.NodeCreated(nodeIndex);
      // const nodeEvents = await rollup.queryFilter(nodeEventFilter);
      // const assertion = nodeEvents[0].args!.assertion;
      // const sendRoot = await helper.getSendRoot(assertion);
      // const blockHash = await helper.getBlockHash(assertion);
      const nodeIndex = await rollup.lastFinalizedBatchHeight();
      const stateRootHash = await rollup.stateRootHash();
      console.log(`nodeIndex ${nodeIndex}`);
      const blockNumber = nodeIndex.toNumber();
      console.log(`blockNumber ${blockNumber}`);
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
      const slot = ethers.utils.keccak256(node + "00".repeat(31) + "01");
      const proof = await l2provider.send("eth_getProof", [
        l2_resolver_address,
        [slot],
        { blockHash },
      ]);
      console.log(6, JSON.stringify(proof, null, 2));
      const accountProof = ethers.utils.RLP.encode(proof.accountProof);
      const storageProof = ethers.utils.RLP.encode(
        (proof.storageProof as any[]).filter((x) => x.key === slot)[0].proof
      );
      const finalProof = {
        nodeIndex: nodeIndex,
        blockHash,
        sendRoot: stateRootHash,
        encodedBlockArray,
        stateTrieWitness: accountProof,
        stateRoot,
        storageTrieWitness: storageProof,
      };
      console.log(7, { finalProof });
      return [finalProof];
    },
  },
]);
const app = server.makeApp("/");
app.listen(options.port);
