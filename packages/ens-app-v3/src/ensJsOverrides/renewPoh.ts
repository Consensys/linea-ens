import {
  encodeFunctionData,
  type Account,
  type Hash,
  type SendTransactionParameters,
  type Transport,
} from 'viem'
import { sendTransaction } from 'viem/actions'

import {
  ChainWithEns,
  ClientWithAccount,
  getChainContractAddress,
} from '@ensdomains/ensjs/contracts'
import {
  SimpleTransactionRequest,
  WriteTransactionParameters,
} from '@ensdomains/ensjs/dist/types/types'

import { Prettify } from '@app/types'

import { ethRegistrarControllerRenewPohSnippet } from './contracts/ethRegistrarController'
import { UnsupportedNameTypeError } from './errors/general'
import { getNameType } from './utils/getNameType'

export type RenewPoHDataParameters = {
  /** Name to renew */
  name: string
  /** POH signature */
  signature: `0x${string}`
}

export type RenewNamesParameters<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined,
> = Prettify<RenewPoHDataParameters & WriteTransactionParameters<TChain, TAccount, TChainOverride>>

export type RenewNamesDataReturnType = SimpleTransactionRequest & {}

export type RenewNamesReturnType = Hash

export const makeFunctionData = <TChain extends ChainWithEns, TAccount extends Account | undefined>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  { name, signature }: RenewPoHDataParameters,
): RenewNamesDataReturnType => {
  const nameType = getNameType(name)
  if (nameType !== 'eth-3ld') {
    throw new UnsupportedNameTypeError({
      nameType,
      supportedNameTypes: ['eth-3ld'],
      details: 'Only 3ld-eth renewals are currently supported',
    })
  }

  const label = name.split('.')[0]

  return {
    to: getChainContractAddress({
      client: wallet,
      contract: 'ensEthRegistrarController',
    }),
    data: encodeFunctionData({
      abi: ethRegistrarControllerRenewPohSnippet,
      functionName: 'renewPoh',
      args: [label, signature],
    }),
  }
}

/**
 * Renews a name or names for a specified duration.
 * @param wallet - {@link ClientWithAccount}
 * @param parameters - {@link RenewNamesParameters}
 * @returns Transaction hash. {@link RenewNamesReturnType}
 *
 * @example
 * import { createPublicClient, createWalletClient, http, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { addEnsContracts } from '@ensdomains/ensjs'
 * import { getPrice } from '@ensdomains/ensjs/public'
 * import { renewNames } from '@ensdomains/ensjs/wallet'
 *
 * const mainnetWithEns = addEnsContracts(mainnet)
 * const client = createPublicClient({
 *   chain: mainnetWithEns,
 *   transport: http(),
 * })
 * const wallet = createWalletClient({
 *   chain: mainnetWithEns,
 *   transport: custom(window.ethereum),
 * })
 *
 * const duration = 31536000 // 1 year
 * const { base, premium } = await getPrice(wallet, {
 *  nameOrNames: 'example.eth',
 *  duration,
 * })
 * const value = (base + premium) * 110n / 100n // add 10% to the price for buffer
 * const hash = await renewNames(wallet, {
 *   nameOrNames: 'example.eth',
 *   duration,
 *   value,
 * })
 * // 0x...
 */
async function renewPoh<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined = ChainWithEns,
>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  { name, signature, ...txArgs }: RenewNamesParameters<TChain, TAccount, TChainOverride>,
): Promise<RenewNamesReturnType> {
  const data = makeFunctionData(wallet, { name, signature })
  const writeArgs = {
    ...data,
    ...txArgs,
  } as SendTransactionParameters<TChain, TAccount, TChainOverride>
  return sendTransaction(wallet, writeArgs)
}

renewPoh.makeFunctionData = makeFunctionData

export default renewPoh
