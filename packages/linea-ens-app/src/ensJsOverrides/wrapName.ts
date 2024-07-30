import {
  encodeAbiParameters,
  encodeFunctionData,
  labelhash,
  toHex,
  type Account,
  type Address,
  type Hash,
  type SendTransactionParameters,
  type Transport,
} from 'viem'
import { sendTransaction } from 'viem/actions'
import { parseAccount } from 'viem/utils'

import { AdditionalParameterSpecifiedError } from '@ensdomains/ensjs'
import {
  baseRegistrarSafeTransferFromWithDataSnippet,
  ChainWithEns,
  ClientWithAccount,
  getChainContractAddress,
  nameWrapperWrapSnippet,
} from '@ensdomains/ensjs/contracts'
import {
  Eth2ldNameSpecifier,
  GetNameType,
  SimpleTransactionRequest,
  WriteTransactionParameters,
} from '@ensdomains/ensjs/dist/types/types'
import {
  EncodeChildFusesInputObject,
  encodeFuses,
  packetToBytes,
  wrappedLabelLengthCheck,
} from '@ensdomains/ensjs/utils'

import { Prettify } from '@app/types'

import { checkIs3LDEth, checkIsDotEth } from './utils/validation'

export type WrapNameDataParameters<
  TName extends string,
  TNameOption extends GetNameType<TName> = GetNameType<TName>,
> = {
  /** The name to wrap */
  name: TName
  /** The recipient of the wrapped name */
  newOwnerAddress: Address
  /** Fuses to set on wrap (eth-2ld only) */
  fuses?: TNameOption extends Eth2ldNameSpecifier ? EncodeChildFusesInputObject : never
  /** The resolver address to set on wrap */
  resolverAddress?: Address
}

export type WrapNameDataReturnType = SimpleTransactionRequest

export type WrapNameParameters<
  TName extends string,
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined,
> = Prettify<
  WrapNameDataParameters<TName> & WriteTransactionParameters<TChain, TAccount, TChainOverride>
>

export type WrapNameReturnType = Hash

export const makeFunctionData = <
  TName extends string,
  TChain extends ChainWithEns,
  TAccount extends Account,
>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  {
    name,
    newOwnerAddress,
    fuses,
    resolverAddress = getChainContractAddress({
      client: wallet,
      contract: 'ensPublicResolver',
    }),
  }: WrapNameDataParameters<TName>,
): WrapNameDataReturnType => {
  const labels = name.split('.')
  const isEth3ld = checkIs3LDEth(labels)

  const nameWrapperAddress = getChainContractAddress({
    client: wallet,
    contract: 'ensNameWrapper',
  })

  if (isEth3ld) {
    wrappedLabelLengthCheck(labels[0])
    const encodedFuses = fuses ? encodeFuses({ restriction: 'child', input: fuses }) : 0
    const tokenId = BigInt(labelhash(labels[0]))

    const data = encodeAbiParameters(
      [
        { name: 'label', type: 'string' },
        { name: 'wrappedOwner', type: 'address' },
        { name: 'ownerControlledFuses', type: 'uint16' },
        { name: 'resolverAddress', type: 'address' },
      ],
      [labels[0], newOwnerAddress, encodedFuses, resolverAddress],
    )

    return {
      to: getChainContractAddress({
        client: wallet,
        contract: 'ensBaseRegistrarImplementation',
      }),
      data: encodeFunctionData({
        abi: baseRegistrarSafeTransferFromWithDataSnippet,
        functionName: 'safeTransferFrom',
        args: [wallet.account.address, nameWrapperAddress, tokenId, data],
      }),
    }
  }

  if (fuses)
    throw new AdditionalParameterSpecifiedError({
      parameter: 'fuses',
      allowedParameters: ['name', 'wrappedOwner', 'resolverAddress'],
      details: 'Fuses cannot be initially set when wrapping non eth-2ld names',
    })

  labels.forEach((label) => wrappedLabelLengthCheck(label))
  return {
    to: nameWrapperAddress,
    data: encodeFunctionData({
      abi: nameWrapperWrapSnippet,
      functionName: 'wrap',
      args: [toHex(packetToBytes(name)), newOwnerAddress, resolverAddress],
    }),
  }
}

/**
 * Wraps a name.
 * @param wallet - {@link ClientWithAccount}
 * @param parameters - {@link WrapNameParameters}
 * @returns Transaction hash. {@link WrapNameReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { addEnsContracts } from '@ensdomains/ensjs'
 * import { wrapName } from '@ensdomains/ensjs/wallet'
 *
 * const wallet = createWalletClient({
 *   chain: addEnsContracts(mainnet),
 *   transport: custom(window.ethereum),
 * })
 * const hash = await wrapName(wallet, {
 *   name: 'ens.eth',
 *   newOwnerAddress: '0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7',
 * })
 * // 0x...
 */
async function wrapName<
  TName extends string,
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined = ChainWithEns,
>(
  wallet: ClientWithAccount<Transport, TChain, TAccount>,
  {
    name,
    newOwnerAddress,
    fuses,
    resolverAddress,
    ...txArgs
  }: WrapNameParameters<TName, TChain, TAccount, TChainOverride>,
): Promise<WrapNameReturnType> {
  const data = makeFunctionData(
    {
      ...wallet,
      account: parseAccount((txArgs.account || wallet.account)!),
    } as ClientWithAccount<Transport, TChain, Account>,
    { name, newOwnerAddress, fuses, resolverAddress },
  )
  const writeArgs = {
    ...data,
    ...txArgs,
  } as SendTransactionParameters<TChain, TAccount, TChainOverride>
  return sendTransaction(wallet, writeArgs)
}

wrapName.makeFunctionData = makeFunctionData

export default wrapName
