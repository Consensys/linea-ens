import { ethers } from "ethers";
import { ROLLUP_ADDRESSES } from "./constants";
const rollupAbi = require("../../abi/rollup.json");
const rollupArbAbi = require("./rollupArb.json");
async function main() {
  const l2_provider = new ethers.providers.JsonRpcProvider(
    "https://consensys-zkevm-goerli-prealpha.infura.io/v3/dd1ad6c018ec409dabc0a2eb345555a5"
  );
  const signer = new ethers.Wallet(
    process.env.GOERLI_ZKEVM_PRIVATE_KEY!
  ).connect(l2_provider);
  const rollupArb = await new ethers.Contract(
    "0x45e5cAea8768F42B385A366D3551Ad1e0cbFAb17",
    rollupArbAbi,
    signer
  );
  const latestConfirmed = await rollupArb.latestConfirmed();
  console.log(`latestConfirmed ${latestConfirmed}`);
  const rollup = await new ethers.Contract(
    ROLLUP_ADDRESSES.goerli,
    rollupAbi,
    signer
  );
  const nodeIndex = await rollup.lastFinalizedBatchHeight();
  console.log(`nodeIndex ${nodeIndex}`);
  const blockNumber = nodeIndex.toNumber();
  console.log("blockNumber", blockNumber);
  const block = await l2_provider.getBlock(blockNumber);
  console.log("block", block);
  const blockHash = block ? block.hash : "";
  const l2blockRaw = await l2_provider.send("eth_getBlockByHash", [
    blockHash,
    false,
  ]);
  console.log("l2blockRaw", l2blockRaw);
  const stateRoot = l2blockRaw.stateRoot;
  console.log(`stateRoot ${stateRoot}`);
  const proof = await l2_provider.send("eth_getProof", [
    "0xc31F4c88146a66Db64B6ae9Aae99C1C0b8C7Aafb",
    ["0x0"],
    blockHash,
  ]);
  console.log("proof", proof);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
