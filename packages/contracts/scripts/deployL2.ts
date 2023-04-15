import { ethers, run } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const chainId = await owner.getChainId();

  // Deploy Linea Resolver to L2
  const LineaResolver = await ethers.getContractFactory("LineaResolver");
  const nftName = "Lineatest";
  const symbol = "LTST";
  const baseUri = "http://localhost:3000/metadata/";
  const lineaResolver = await LineaResolver.deploy(nftName, symbol, baseUri);
  await lineaResolver.deployed();

  // Test with subdomain with default "julink.lineatest.eth", assuming we still control lineatest.eth on L1
  const name = process.env.L2_ENS_NAME ? process.env.L2_ENS_NAME : "julink.lineatest.eth";
  const tx = await lineaResolver.mintSubdomain(name, owner.address);
  await tx.wait();
  console.log(`LineaResolver deployed to, L2_RESOLVER_ADDRESS: ${lineaResolver.address}`);

  if (chainId !== 31337) {
    setTimeout(async () => {
      await run("verify:verify", {
        address: lineaResolver.address,
        constructorArguments: [nftName, symbol],
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
