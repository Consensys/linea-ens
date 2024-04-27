import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { owner } = await getNamedAccounts()

  const fixedPriceOracleDeployment = await deploy('FixedPriceOracle', {
    from: owner,
    log: true,
  })

  if (!fixedPriceOracleDeployment.newlyDeployed) {
    console.error('Failed to deploy FixedPriceOracle')
    return
  }
}

func.id = 'fixed-price-oracle'
func.tags = ['ethregistrar', 'FixedPriceOracle']

export default func
