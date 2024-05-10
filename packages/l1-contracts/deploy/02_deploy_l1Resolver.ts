import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { address as ENSRegistrySepoliaAddr } from "../../l2-contracts/deployments/sepolia/ENSRegistry.json";
import { address as NameWrapperSepoliaAddr } from "../../l2-contracts/deployments/sepolia/NameWrapper.json";
import { address as PublicResolverLineaSepoliaAddr } from "../../l2-contracts/deployments/lineaSepolia/PublicResolver.json";
import { address as ENSRegistryMainnetAddr } from "../../l2-contracts/deployments/mainnet/ENSRegistry.json";
import { address as NameWrapperMainnetAddr } from "../../l2-contracts/deployments/mainnet/NameWrapper.json";
import { address as PublicResolverMainnetAddr } from "../../l2-contracts/deployments/mainnet/PublicResolver.json";
import packet from "dns-packet";

const encodeName = (name) => "0x" + packet.name.encode(name).toString("hex");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network, ethers } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const lineaSparseProofVerifier = await get("LineaSparseProofVerifier");
  // ens namehash of linea-sepolia.eth
  let node = encodeName("linea-sepolia.eth");
  let target = PublicResolverLineaSepoliaAddr;

  const args: any[] = [];
  switch (network.name) {
    case "sepolia":
      args.push(
        lineaSparseProofVerifier.address,
        ENSRegistrySepoliaAddr,
        NameWrapperSepoliaAddr,
        "https://api.studio.thegraph.com/query/69290/ens-linea-sepolia/version/latest",
        59141
      );
      break;
    case "mainnet":
      // ens namehash of linea.eth
      node = encodeName("linea.eth");
      target = PublicResolverMainnetAddr;
      // TODO add when deployed on mainnet
      // args.push(PohVerifierSepoliaAddr,ENSRegistryMainnetAddr, NameWrapperMainnetAddr);
      // break;
      console.log("Mainnet deployment not ready");
      return;
    default:
      console.log(`Network ${network.name} not supported`);
      return;
  }

  const l1ResolverDeploy = await deploy("L1Resolver", {
    from: deployer,
    args,
    log: true,
  });
  console.log(`Deployed L1Resolver to ${l1ResolverDeploy.address}`);

  const l1Resolver = await ethers.getContractAt(
    "L1Resolver",
    l1ResolverDeploy.address
  );
  const tx = await l1Resolver.setTarget(node, target);
  await tx.wait();

  console.log(`Set target on L1Resolver for ${node} to ${target}`);
};

func.tags = ["l1Resolver"];
func.dependencies = ["lineaSparseProofVerifier"];

export default func;
