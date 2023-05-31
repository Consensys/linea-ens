import { ethers, run, upgrades } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const chainId = await owner.getChainId();

  // Deploy Linea Resolver to L2
  const LineaResolver = await ethers.getContractFactory("LineaResolver");
  const nftName = process.env.L2_RESOLVER_NFT_NAME;
  const symbol = process.env.L2_RESOLVER_NFT_SYMBOL;
  const baseUri = process.env.L2_RESOLVER_NFT_BASE_URI;
  const lineaResolver = await upgrades.deployProxy(LineaResolver, [nftName, symbol, baseUri]);
  await lineaResolver.deployed();

  // Test with subdomain with default "julink.lineatest.eth", assuming we still control lineatest.eth on L1
  const name = process.env.L2_ENS_SUBDOMAIN_TEST ? process.env.L2_ENS_SUBDOMAIN_TEST : "julink.lineatest.eth";
  const tx = await lineaResolver.mintSubdomain(name, owner.address, { value: ethers.utils.parseEther("0.001") });
  await tx.wait();
  console.log(`LineaResolver deployed to, L2_RESOLVER_ADDRESS: ${lineaResolver.address}`);

  if (chainId !== 31337) {
    setTimeout(async () => {
      await run("verify:verify", {
        address: lineaResolver.address,
        constructorArguments: [nftName, symbol, baseUri],
      });
    }, 30000);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
