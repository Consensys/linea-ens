import { Command } from "commander";
import { ethers } from "ethers";
import fetch from "cross-fetch";
import { REGISTRY_ADDRESS } from "./constants";

const namehash = require("eth-ens-namehash");
const StubAbi = require("../abi/LineaResolverStub.json").abi;
const ensRegistryAbi = require("../abi/ENSRegistry.json");
const program = new Command();
const { defaultAbiCoder, hexConcat } = require("ethers/lib/utils");
program
  .requiredOption("-r --registry <address>", "ENS registry address")
  .option(
    "-l1 --l1_provider_url <url1>",
    "L1_PROVIDER_URL",
    "http://127.0.0.1:8545/"
  )
  .option(
    "-l2 --l2_provider_url <url2>",
    "L2_PROVIDER_URL",
    "https://consensys-zkevm-goerli-prealpha.infura.io/v3/16fff764ff2145c2b137fbe8013730c6"
  )
  .option("-i --chainId <chainId>", "chainId", "31337")
  .option("-n --chainName <chainName>", "chainName", "unknown")
  .option("-d --debug", "debug", false)
  .argument("<name>");

program.parse(process.argv);
const options = program.opts();
const ensAddress = options.registry;
const chainId = parseInt(options.chainId);
const { chainName, l1_provider_url, debug } = options;
console.log("options", {
  l1_provider_url,
  ensAddress,
  chainId,
  chainName,
  debug,
});
let provider: ethers.providers.JsonRpcProvider;
if (chainId && chainName) {
  provider = new ethers.providers.JsonRpcProvider(l1_provider_url, {
    chainId,
    name: chainName,
    ensAddress,
  });
} else {
  provider = new ethers.providers.JsonRpcProvider(options.l1_provider_url);
}

(async () => {
  const name = program.args[0];
  const node = namehash.hash(name);
  console.log("node", node);
  let resolverAddr = (await getResolver(name))[0];
  console.log("resolverAddr", resolverAddr);
  let test = (await getResolver("1.offchainexample.eth"))[0];
  console.log("test", test);
  if (resolverAddr) {
    const resolver = new ethers.Contract(resolverAddr, StubAbi, provider);
    try {
      if (debug) {
        // this will throw OffchainLookup error
        console.log(await resolver.callStatic["addr(bytes32)"](node));
      } else {
        console.log(
          "addr(bytes32)        ",
          await resolver.callStatic["addr(bytes32)"](node, {
            ccipReadEnabled: true,
          })
        );
        console.log(
          "addr(bytes32,uint256)",
          await resolver.callStatic["addr(bytes32,uint256)"](node, 60, {
            ccipReadEnabled: true,
          })
        );
        console.log("resolveName", await provider.resolveName(name));
      }
    } catch (e: any) {
      // Manually calling the gateway
      console.log("error", e);
      if (e.errorArgs) {
        const { sender, urls, callData, callbackFunction, extraData } =
          e.errorArgs;
        console.log(1, { sender, urls, callData, callbackFunction, extraData });
        const url = urls[0]
          .replace(/{sender}/, sender)
          .replace(/{data}/, callData);
        console.log(2, { url });
        const responseData: any = await (await fetch(url)).json();
        console.log(3, { responseData });
        if (responseData) {
          try {
            const encoded = defaultAbiCoder.encode(
              ["bytes", "bytes"],
              [responseData.data, extraData]
            );
            const data = hexConcat([callbackFunction, encoded]);
            const result = await resolver.provider.call({
              to: resolver.address,
              data,
            });
            console.log(4, { result });
            const decodedResult = resolver.interface.decodeFunctionResult(
              "addrWithProof",
              result
            );
            console.log(5, { decodedResult });
          } catch (ee) {
            console.log(6, { ee });
          }
        }
      }
    }
  }
})();

async function getResolver(name: string) {
  const parent = (currentname: string) => {
    const index = currentname.indexOf(".");
    return currentname.substring(index + 1, currentname.length);
  };

  for (
    let currentname = name;
    currentname !== "";
    currentname = parent(currentname)
  ) {
    console.log("currentname", currentname);
    const node = namehash.hash(currentname);
    const ens = new ethers.Contract(REGISTRY_ADDRESS, ensRegistryAbi, provider);
    const resolver = await ens.resolver(node);
    if (resolver != "0x0000000000000000000000000000000000000000") {
      return [resolver, currentname];
    }
  }
  return [null, ""];
}
