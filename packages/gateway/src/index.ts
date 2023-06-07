import { Server } from "@chainlink/ccip-read-server";
import { Command } from "commander";
import { ethers } from "ethers";
import { Result } from "ethers/lib/utils";

const IResolverAbi = require("../abi/IResolverService.json").abi;
const lineaResolverAbi = require("../abi/LineaResolver.json").abi;
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

const l2provider = new ethers.providers.JsonRpcProvider(l2_provider_url);
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

        const l2Resolver = new ethers.Contract(
          l2_resolver_address,
          lineaResolverAbi,
          l2provider
        );
        const addr = await l2Resolver.resolve(node);

        console.log("\n--------------------REQUEST END--------------------\n");

        return [addr];
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
