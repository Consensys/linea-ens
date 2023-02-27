import { ethers, network } from "hardhat";
import { ROLLUP_ADDRESSES } from "./constants";

async function main() {
  // Deploy ZkEVM Resolver to L2
  const ZkEVMResolver = await ethers.getContractFactory("ZkEVMResolver");
  const zkEVMResolver = await ZkEVMResolver.deploy();
  await zkEVMResolver.deployed();
  console.log(`ZkEVMResolver deployed to ${zkEVMResolver.address}`);

  // Deploy ZkEVM Resolver Stub to L1
  const rollupAddress =
    ROLLUP_ADDRESSES[network.name as keyof typeof ROLLUP_ADDRESSES];
  const gatewayUrl = "http://localhost:3000";
  const ZkEVMResolverStub = await ethers.getContractFactory(
    "ZkEVMResolverStub"
  );
  const zkEVMResolverStub = await ZkEVMResolverStub.deploy(
    [gatewayUrl],
    rollupAddress,
    zkEVMResolver.address
  );
  await zkEVMResolverStub.deployed();
  console.log(`ZkEVMResolverStub deployed to ${zkEVMResolverStub.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
