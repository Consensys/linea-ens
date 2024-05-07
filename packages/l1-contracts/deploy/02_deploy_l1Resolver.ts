import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { address as ENSRegistrySepoliaAddr } from "../../l2-contracts/deployments/sepolia/ENSRegistry.json";
import { address as NameWrapperSepoliaAddr } from "../../l2-contracts/deployments/sepolia/NameWrapper.json";
import { address as PublicResolverLineaSepoliaAddr } from "../../l2-contracts/deployments/lineaSepolia/PublicResolver.json";
import { address as ENSRegistryMainnetAddr } from "../../l2-contracts/deployments/mainnet/ENSRegistry.json";
import { address as NameWrapperMainnetAddr } from "../../l2-contracts/deployments/mainnet/NameWrapper.json";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const lineaSparseProofVerifier = await get("LineaSparseProofVerifier");

  const args: string[] = [];
  switch (network.name) {
    case "sepolia":
      args.push(
        lineaSparseProofVerifier.address,
        ENSRegistrySepoliaAddr,
        NameWrapperSepoliaAddr
      );
      break;
    case "mainnet":
      // TODO add when deployed on mainnet
      // args.push(PohVerifierSepoliaAddr,ENSRegistryMainnetAddr, NameWrapperMainnetAddr);
      // break;
      console.log("Mainnet deployment not ready");
      return;
    default:
      console.log(`Network ${network.name} not supported`);
      return;
  }

  const l1Resolver = await deploy("L1Resolver", {
    from: deployer,
    args,
    log: true,
  });
  console.log(`Deployed L1Resolver to ${l1Resolver.address}`);
};

func.tags = ["l1Resolver"];
func.dependencies = ["lineaSparseProofVerifier"];

export default func;
