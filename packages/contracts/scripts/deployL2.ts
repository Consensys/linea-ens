import { ethers, run } from "hardhat";
const namehash = require("eth-ens-namehash");

async function main() {
  const [owner] = await ethers.getSigners();
  const chainId = await owner.getChainId();

  // Deploy Linea Resolver to L2
  const LineaResolver = await ethers.getContractFactory("LineaResolver");
  const lineaResolver = await LineaResolver.deploy();
  await lineaResolver.deployed();

  // Test with subdomain "julink.lineatest.eth" assuming we still control lineatest.eth on L1
  const node = namehash.hash("julink.lineatest.eth");
  const tx = await lineaResolver.setAddr(node, owner.address);
  await tx.wait();
  console.log(`LineaResolver deployed to, L2_RESOLVER_ADDRESS: ${lineaResolver.address}`);

  if (chainId !== 31337) {
    setTimeout(async () => {
      await run("verify", {
        address: lineaResolver.address,
      });
    }, 10000);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
