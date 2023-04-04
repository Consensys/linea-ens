import { ethers, network, run } from "hardhat";
import {
  ETH_REGISTRAR_CONTROLLER_ADDRESS,
  REGISTRY_ADDRESS,
  ROLLUP_ADDRESSES,
} from "./constants";
const ensRegistryAbi = require("../abi/ENSRegistry.json");
const eTHRegistrarControllerAbi = require("../abi/ETHRegistrarController.json");
const namehash = require("eth-ens-namehash");

let L2_RESOLVER_ADDRESS: string;
async function main() {
  const [owner] = await ethers.getSigners();
  // Deploy the assertion helper
  // const AssertionHelper = await ethers.getContractFactory("AssertionHelper");
  // const assertionHelper = await AssertionHelper.deploy();
  // await assertionHelper.deployed();
  // console.log(
  //   `AssertionHelper deployed at HELPER_ADDRESS: ${assertionHelper.address}`
  // );

  if (process.env.L2_RESOLVER_ADDRESS) {
    L2_RESOLVER_ADDRESS = process.env.L2_RESOLVER_ADDRESS;
  } else {
    throw "Set L2_RESOLVER_ADDRESS=";
  }

  // Deploy Linea Resolver Stub to L1
  const rollupAddress =
    ROLLUP_ADDRESSES[network.name as keyof typeof ROLLUP_ADDRESSES];
  const gatewayUrl = "http://localhost:8080/{sender}/{data}.json";
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

  const registryAddr =
    REGISTRY_ADDRESS[network.name as keyof typeof REGISTRY_ADDRESS];
  const registry = await new ethers.Contract(
    registryAddr,
    ensRegistryAbi,
    owner
  );
  const node = namehash.hash("lineatest.eth");
  console.log("node", node);
  let tx = await registry.setResolver(node, lineaResolverStub.address);
  await tx.wait();

  // Create a new ENS
  // const secret =
  //   "0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";
  // const ethRegistrarControllerAddr =
  //   ETH_REGISTRAR_CONTROLLER_ADDRESS[
  //     network.name as keyof typeof ETH_REGISTRAR_CONTROLLER_ADDRESS
  //   ];
  // const ethRegistrarController = await new ethers.Contract(
  //   ethRegistrarControllerAddr,
  //   eTHRegistrarControllerAbi,
  //   owner
  // );
  // const ensTest = "lineatester";

  // if (await ethRegistrarController.available(ensTest)) {
  //   const makeCommitmentResp = await ethRegistrarController.makeCommitment(
  //     ensTest,
  //     owner.address,
  //     secret
  //   );

  //   console.log("makeCommitmentResp", makeCommitmentResp);
  //   await ethRegistrarController.commit(makeCommitmentResp);
  //   console.log("commit done");
  //   await network.provider.send("evm_increaseTime", [12000]);
  //   await ethRegistrarController.register(
  //     ensTest,
  //     owner.address,
  //     "10000000",
  //     secret,
  //     { value: ethers.utils.parseEther("1") }
  //   );
  // }

  // // Set the sub node
  // const registryAddress =
  //   REGISTRY_ADDRESS[network.name as keyof typeof REGISTRY_ADDRESS];
  // const registry = await new ethers.Contract(
  //   registryAddress,
  //   ensRegistryAbi,
  //   owner
  // );

  // const node = namehash.hash("lineatester.eth");
  // await registry.setResolver(node, lineaResolverStub.address);

  // setTimeout(async () => {
  //   await run("verify:verify", {
  //     address: "0x56B185364e154CdA8a84642CB11FFca86FaeAd18",
  //     constructorArguments: [[gatewayUrl], rollupAddress, L2_RESOLVER_ADDRESS],
  //   });
  // }, 1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
