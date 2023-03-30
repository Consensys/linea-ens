import { ethers, network } from "hardhat";
import { ROLLUP_ADDRESSES } from "./constants";

let L2_RESOLVER_ADDRESS;
async function main() {
  // Deploy the assertion helper
  const AssertionHelper = await ethers.getContractFactory("AssertionHelper");
  const assertionHelper = await AssertionHelper.deploy();
  await assertionHelper.deployed();
  console.log(
    `AssertionHelper deployed at HELPER_ADDRESS: ${assertionHelper.address}`
  );

  if (process.env.L2_RESOLVER_ADDRESS) {
    L2_RESOLVER_ADDRESS = process.env.L2_RESOLVER_ADDRESS;
  } else {
    throw "Set L2_RESOLVER_ADDRESS=";
  }

  // Deploy Linea Resolver Stub to L1
  const rollupAddress =
    ROLLUP_ADDRESSES[network.name as keyof typeof ROLLUP_ADDRESSES];
  const gatewayUrl = "http://localhost:8080";
  const LineaResolverStub = await ethers.getContractFactory(
    "LineaResolverStub"
  );
  const lineaResolverStub = await LineaResolverStub.deploy(
    [gatewayUrl],
    rollupAddress,
    L2_RESOLVER_ADDRESS
  );
  await lineaResolverStub.deployed();
  console.log(`LineaResolverStub deployed to ${lineaResolverStub.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
