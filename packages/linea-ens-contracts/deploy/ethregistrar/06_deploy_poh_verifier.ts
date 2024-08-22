import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { owner } = await getNamedAccounts()

  if (network.tags.reuse_poh_verifier) {
    console.log('Reusing PohVerifier')
    return true
  }

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
