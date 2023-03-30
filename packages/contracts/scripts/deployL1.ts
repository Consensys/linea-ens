import { ethers, network } from "hardhat";
import { ROLLUP_ADDRESSES } from "./constants";

let RESOLVER_ADDRESS;
async function main() {
  // Deploy the assertion helper
  const AssertionHelper = await ethers.getContractFactory("AssertionHelper");
  const assertionHelper = await AssertionHelper.deploy();
  await assertionHelper.deployed();
  console.log(`AssertionHelper deployed at ${assertionHelper.address}`);

  if (process.env.RESOLVER_ADDRESS) {
    RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS;
  } else {
    throw "Set RESOLVER_ADDRESS=";
  }

  // Deploy ZkEVM Resolver Stub to L1
  const rollupAddress =
    ROLLUP_ADDRESSES[network.name as keyof typeof ROLLUP_ADDRESSES];
  const gatewayUrl = "http://localhost:8080";
  const ZkEVMResolverStub = await ethers.getContractFactory(
    "ZkEVMResolverStub"
  );
  const LineaResolverStub = await ZkEVMResolverStub.deploy(
    [gatewayUrl],
    rollupAddress,
    RESOLVER_ADDRESS
  );
  await LineaResolverStub.deployed();
  console.log(`ZkEVMResolverStub deployed to ${LineaResolverStub.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
