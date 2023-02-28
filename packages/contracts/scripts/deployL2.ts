import { ethers } from "hardhat";

async function main() {
  // Deploy ZkEVM Resolver to L2
  const ZkEVMResolver = await ethers.getContractFactory("ZkEVMResolver");
  const zkEVMResolver = await ZkEVMResolver.deploy();
  await zkEVMResolver.deployed();
  console.log(`ZkEVMResolver deployed to ${zkEVMResolver.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
