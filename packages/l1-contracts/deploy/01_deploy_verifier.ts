import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const sparseMerkleProof = await get("SparseMerkleProof");

  const lineaSparseProofVerifier = await deploy("LineaSparseProofVerifier", {
    from: deployer,
    libraries: {
      SparseMerkleProof: sparseMerkleProof.address,
    },
    log: true,
  });
  console.log(
    `Deployed LineaSparseProofVerifier to ${lineaSparseProofVerifier.address}`
  );
};

func.tags = ["lineaSparseProofVerifier"];
func.dependencies = ["sparseMerkleProof"];

export default func;
