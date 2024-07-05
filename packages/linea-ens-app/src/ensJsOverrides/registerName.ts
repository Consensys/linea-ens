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
  ethRegistrarControllerRegisterSnippet,
  getChainContractAddress,
} from '@ensdomains/ensjs/contracts'
import {
  Prettify,
  SimpleTransactionRequest,
  WriteTransactionParameters,
} from '@ensdomains/ensjs/dist/types/types'
import { makeRegistrationTuple, wrappedLabelLengthCheck } from '@ensdomains/ensjs/utils'

import { UnsupportedNameTypeError } from './errors/general'
import { getNameType } from './utils/getNameType'
import { RegistrationParameters } from './utils/registerPohHelpers'

export type RegisterNameDataParameters = RegistrationParameters & {
  /** Value of registration */
  value: bigint
}

export type RegisterNameDataReturnType = SimpleTransactionRequest & {
  value: bigint
}

export type RegisterNameParameters<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined,
> = Prettify<
  RegisterNameDataParameters & WriteTransactionParameters<TChain, TAccount, TChainOverride>
>

export type RegisterNameReturnType = Hash

export const makeFunctionData = <TChain extends ChainWithEns, TAccount extends Account | undefined>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  { value, ...args }: RegisterNameDataParameters,
): RegisterNameDataReturnType => {
  const nameType = getNameType(args.name)
  if (nameType !== 'eth-2ld' && nameType !== 'eth-3ld')
    throw new UnsupportedNameTypeError({
      nameType,
      supportedNameTypes: ['eth-2ld', 'eth-3ld'],
      details: 'Only 2ld-eth and eth-3ld name registration are supported',
    })

  const labels = args.name.split('.')
  wrappedLabelLengthCheck(labels[0])

  return {
    to: getChainContractAddress({
      client: wallet,
      contract: 'ensEthRegistrarController',
    }),
    data: encodeFunctionData({
      abi: ethRegistrarControllerRegisterSnippet,
      functionName: 'register',
      args: makeRegistrationTuple(args),
    }),
    value,
  }
}

/**
 * Registers a name on ENS
 * @param wallet - {@link ClientWithAccount}
 * @param parameters - {@link RegisterNameParameters}
 * @returns Transaction hash. {@link RegisterNameReturnType}
 *
 * @example
 * import { createPublicClient, createWalletClient, http, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { addEnsContracts } from '@ensdomains/ensjs'
 * import { getPrice } from '@ensdomains/ensjs/public'
 * import { randomSecret } from '@ensdomains/ensjs/utils'
 * import { commitName, registerName } from '@ensdomains/ensjs/wallet'
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
 * const secret = randomSecret()
 * const params = {
 *   name: 'example.eth',
 *   owner: '0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7',
 *   duration: 31536000, // 1 year
 *   secret,
 * }
 *
 * const commitmentHash = await commitName(wallet, params)
 * await client.waitForTransactionReceipt({ hash: commitmentHash }) // wait for commitment to finalise
 * await new Promise((resolve) => setTimeout(resolve, 60 * 1_000)) // wait for commitment to be valid
 *
 * const { base, premium } = await getPrice(client, { nameOrNames: params.name, duration: params.duration })
 * const value = (base + premium) * 110n / 100n // add 10% to the price for buffer
 * const hash = await registerName(wallet, { ...params, value })
 * // 0x...
 */
async function registerName<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined = ChainWithEns,
>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  {
    name,
    owner,
    duration,
    secret,
    resolverAddress,
    records,
    reverseRecord,
    fuses,
    value,
    ...txArgs
  }: RegisterNameParameters<TChain, TAccount, TChainOverride>,
): Promise<RegisterNameReturnType> {
  const data = makeFunctionData(wallet, {
    name,
    owner,
    duration,
    secret,
    resolverAddress,
    records,
    reverseRecord,
    fuses,
    value,
  })
  const writeArgs = {
    ...data,
    ...txArgs,
  } as SendTransactionParameters<TChain, TAccount, TChainOverride>
  return sendTransaction(wallet, writeArgs)
}

registerName.makeFunctionData = makeFunctionData

export default registerName
