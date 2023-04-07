import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers, BytesLike } from "ethers";
import { Result } from "ethers/lib/utils";

const IResolverAbi = require("../abi/IResolverService.json")
  .abi;
const IResolverL2Abi = require("../abi/LineaResolver.json")
  .abi;
import { abi as Resolver_abi } from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/Resolver.sol/Resolver.json";

const Resolver = new ethers.utils.Interface(Resolver_abi);
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
console.log({ options });
const {
  l1_provider_url,
  l2_provider_url,
  rollup_address,
  l2_resolver_address,
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
    type: "resolve",
    func: async ([encodedName, data]: Result, request) => {
      console.log("encodedName", encodedName);
      const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
      console.log("name", name);
      const node = ethers.utils.namehash(name);
      console.log("node", node);
      const addrSlot = ethers.utils.keccak256(node + "00".repeat(31) + "01");

      if (debug) {
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
      const stateRootHash = await rollup.stateRootHash();
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

      // Result that will returned to the client after verification of the proof
      const { result } = await getResult(name, data);

      const finalProof = {
        nodeIndex: blockNumber,
        blockHash,
        sendRoot: stateRootHash,
        encodedBlockArray,
        stateTrieWitness: accountProof,
        stateRoot,
        storageTrieWitness: storageProof,
        node,
        result,
      };
      console.log(7, { finalProof });
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

async function getResult(
  name: string,
  data: string
): Promise<{ result: BytesLike }> {
  // Parse the data nested inside the second argument to `resolve`
  const { signature, args } = Resolver.parseTransaction({ data });
  console.log("signature", signature);

  if (ethers.utils.nameprep(name) !== name) {
    throw new Error("Name must be normalised");
  }

  if (ethers.utils.namehash(name) !== args[0]) {
    throw new Error("Name does not match namehash");
  }

  const resolverL2 = await new ethers.Contract(
    l2_resolver_address,
    IResolverL2Abi,
    l2provider
  );
  const node = ethers.utils.namehash(name);
  const result = await resolverL2.addr(node);

  return {
    result: Resolver.encodeFunctionResult(signature, [result]),
  };
}
