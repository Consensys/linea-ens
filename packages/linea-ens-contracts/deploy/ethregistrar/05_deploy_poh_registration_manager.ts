import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { owner } = await getNamedAccounts()

  const pohRegistrationManagerDeployment = await deploy(
    'PohRegistrationManager',
    {
      from: owner,
      log: true,
    },
  )

  if (!pohRegistrationManagerDeployment.newlyDeployed) {
    console.error('Failed to deploy PohRegistrationManager')
    return
  }
}

func.id = 'poh-registration-manager'
func.tags = ['ethregistrar', 'PohRegistrationManager']

export default func
