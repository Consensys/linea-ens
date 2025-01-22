/* eslint-disable import/no-extraneous-dependencies */
import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

import { ethers, utils } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import YAML from 'yaml'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!process.env.BASE_DOMAIN) {
    throw 'BASE_DOMAIN env needs to be initialized'
  }

  const allDeployments = await hre.deployments.all()
  const deploymentAddressArray = Object.keys(allDeployments).map((dkey) => [
    dkey,
    allDeployments[dkey].address,
  ])
  const deploymentAddressMap = Object.fromEntries(deploymentAddressArray)

  await writeFile(
    resolve(__dirname, '../.env.local'),
    `NEXT_PUBLIC_DEPLOYMENT_ADDRESSES='${JSON.stringify(deploymentAddressMap)}'`,
  )
  if (!existsSync(resolve(__dirname, '../typings-custom/generated'))) {
    await mkdir(resolve(__dirname, '../typings-custom/generated'))
  }
  await writeFile(
    resolve(__dirname, '../typings-custom/generated/local-contracts-generated.d.ts'),
    `declare module '@app/local-contracts' {
    interface Register {
      deploymentAddresses: {
        ${deploymentAddressArray.map(([name, address]) => `${name}: '${address}'`).join('\n      ')}
      }
    }
  }
  `,
  )
  console.log('Wrote contract addresses to .env.local')

  const deploymentsSubgraphNames = {
    ENSRegistry: deploymentAddressMap['ENSRegistry'],
    ENSRegistryOld: deploymentAddressMap['LegacyENSRegistry'],
    Resolver: deploymentAddressMap['PublicResolver'],
    BaseRegistrar: deploymentAddressMap['BaseRegistrarImplementation'],
    EthRegistrarControllerOld: deploymentAddressMap['LegacyETHRegistrarController'],
    ETHRegistrarController: deploymentAddressMap['ETHRegistrarController'],
    NameWrapper: deploymentAddressMap['NameWrapper'],
  }

  const subgraphYamlPath = resolve(__dirname, '../../linea-ens-subgraph/subgraph.yaml')
  const subgraphYamlFile = await readFile(subgraphYamlPath, 'utf8')

  const subgraphYaml = YAML.parse(subgraphYamlFile)
  const dataSources = subgraphYaml.dataSources

  dataSources.map((dataSource) => {
    dataSource.source.address = deploymentsSubgraphNames[dataSource.name]
  })

  await writeFile(subgraphYamlPath, YAML.stringify(subgraphYaml))

  console.log(
    'Updated subgraph.yaml in packages/linea-ens-subgraph with the local deployment addresses',
  )

  const subgraphEnvPath = resolve(__dirname, '../../linea-ens-subgraph/src/env.ts')

  const baseDomain = `${process.env.BASE_DOMAIN}.eth`
  const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(process.env.BASE_DOMAIN))
  const envSrc =
    `export const BASE_DOMAIN = "${baseDomain}";\n` +
    `export const BASE_NODE = "${utils.namehash(baseDomain)}";\n` +
    `export const BASE_LABEL = "${process.env.BASE_DOMAIN}";\n` +
    `export const BASE_LABEL_HASH = "${labelHash}";\n`

  await writeFile(subgraphEnvPath, envSrc)

  console.log('Updated env.ts in packages/linea-ens-subgraph with the env base domain')
}

func.runAtTheEnd = true
func.tags = ['get-contract-addresses']

export default func
