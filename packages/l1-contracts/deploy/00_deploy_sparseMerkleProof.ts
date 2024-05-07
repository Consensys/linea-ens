import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const mimc = await deploy("Mimc", {
    from: deployer,
    log: true,
  });

  console.log(`Deployed Mimc lib ${mimc.address}`);

  const sparseMerkleProof = await deploy("SparseMerkleProof", {
    from: deployer,
    libraries: { Mimc: await mimc.address },
    log: true,
  });

  console.log(`Deployed SparseMerkleProof lib to ${sparseMerkleProof.address}`);
};

func.tags = ["sparseMerkleProof"];
func.dependencies = [];

export default func;
