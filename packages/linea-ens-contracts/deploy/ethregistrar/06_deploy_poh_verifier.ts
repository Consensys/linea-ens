import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { owner } = await getNamedAccounts()

  const pohVerifierDeployment = await deploy('PohVerifier', {
    from: owner,
    log: true,
  })

  if (!pohVerifierDeployment.newlyDeployed) {
    console.error('Failed to deploy PohVerifier')
    return
  }
}

func.id = 'poh-verifier'
func.tags = ['ethregistrar', 'PohVerifier']

export default func
