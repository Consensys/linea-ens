import { ethers, network, run } from "hardhat";
import { REGISTRY_ADDRESS, ROLLUP_ADDRESS } from "./constants";
import ensRegistryAbi from "../abi/ENSRegistry.json";

const HARDHAT_NETWORK_CHAIN_ID = 31337;

let L2_RESOLVER_ADDRESS: string;
async function main() {
  const [owner, hardhatAccount] = await ethers.getSigners();
  const chainId = await owner.getChainId();

  // If on localhost we can send ETH to the owner so that we make sure we have enough for deployment
  if (chainId === HARDHAT_NETWORK_CHAIN_ID) {
    await hardhatAccount.sendTransaction({ value: ethers.utils.parseEther("100"), to: owner.address });
  }

  if (process.env.L2_RESOLVER_ADDRESS) {
    L2_RESOLVER_ADDRESS = process.env.L2_RESOLVER_ADDRESS;
  } else {
    throw "Set L2_RESOLVER_ADDRESS=";
  }

  // Deploy Linea Resolver Stub to L1
  const gatewayUrl = process.env.GATEWAY_URL ? process.env.GATEWAY_URL : "http://localhost:8080/{sender}/{data}.json";
  const rollupAddr = ROLLUP_ADDRESS[network.name as keyof typeof ROLLUP_ADDRESS];
  const LineaResolverStub = await ethers.getContractFactory("LineaResolverStub");
  const lineaResolverStub = await LineaResolverStub.deploy([gatewayUrl]);
  await lineaResolverStub.deployed();
  console.log(`LineaResolverStub deployed to ${lineaResolverStub.address}`);
  const registryAddr = REGISTRY_ADDRESS[network.name as keyof typeof REGISTRY_ADDRESS];
  const registry = await new ethers.Contract(registryAddr, ensRegistryAbi, owner);
  const name = process.env.L1_ENS_DOMAIN ? process.env.L1_ENS_DOMAIN : "lineatest.eth";
  const node = ethers.utils.namehash(name);
  const tx = await registry.setResolver(node, lineaResolverStub.address);
  await tx.wait();
  console.log("L1 ENS name:", name, ", set to LineaResolverStub: ", lineaResolverStub.address);

  if (chainId !== HARDHAT_NETWORK_CHAIN_ID) {
    // Only verify on "live" blockchain
    setTimeout(async () => {
      console.log("Verify on Etherscan");
      try {
        await run("verify:verify", {
          address: lineaResolverStub.address,
          constructorArguments: [[gatewayUrl], L2_RESOLVER_ADDRESS, rollupAddr],
        });
      } catch (error) {
        console.error(error.message);
      }
    }, 20000);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
