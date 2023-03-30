import { Command } from "commander";
import { ethers } from "ethers";
import fetch from "cross-fetch";

const namehash = require("eth-ens-namehash");
const StubAbi = require("../abi/LineaResolverStub.json").abi;
const IResolverAbi = require("../abi/IResolverService.json").abi;
const program = new Command();
const { defaultAbiCoder, hexConcat } = require("ethers/lib/utils");
program
  .requiredOption("-r --registry <address>", "ENS registry address")
  .option(
    "-l1 --l1_provider_url <url1>",
    "L1_PROVIDER_URL",
    "http://localhost:8545"
  )
  .option(
    "-l2 --l2_provider_url <url2>",
    "L2_PROVIDER_URL",
    "http://localhost:8545"
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
let provider;
if (chainId && chainName) {
  provider = new ethers.providers.JsonRpcProvider(l1_provider_url, {
    chainId,
    name: chainName,
    ensAddress,
  });
} else {
  provider = new ethers.providers.JsonRpcProvider(options.l1_provider_url);
}
// provider.on("debug", console.log)
const l2provider = new ethers.providers.JsonRpcProvider(
  options.l2_provider_url
);
(async () => {
  const l1ChainId = parseInt(await provider.send("eth_chainId", []));
  const l2ChainId = parseInt(await l2provider.send("eth_chainId", []));
  const name = program.args[0];
  const node = namehash.hash(name);
  let r = await provider.getResolver(name);
  if (r) {
    const resolver = new ethers.Contract(r.address, StubAbi, provider);
    const iresolver = new ethers.Contract(r.address, IResolverAbi, provider);
    try {
      if (debug) {
        // this will throw OffchainLookup error
        console.log(await resolver.callStatic["addr(bytes32)"](node));
      } else {
        const beforeTime = new Date().getTime();
        console.log("getAddress           ", await r.getAddress());
        const afterTime = new Date().getTime();
        console.log("(call time=", afterTime - beforeTime, ")");
        console.log("getAddress(60)       ", await r.getAddress(60));
        console.log(
          "_fetchBytes          ",
          await r._fetchBytes(
            "0xf1cb7e06",
            "0x000000000000000000000000000000000000000000000000000000000000003c"
          )
        );
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
