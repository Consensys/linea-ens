import type { TFunction } from 'react-i18next'
import { Hex } from 'viem'

import renewPoh from '@app/ensJsOverrides/renewPoh'
import { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'

import { secondsToYears, yearsToSeconds } from '../../utils/utils'

type Data = {
  name: string
  signature: Hex
}

const toSingleDecimal = (duration: number) => parseFloat(secondsToYears(duration).toFixed(1))

const duration = yearsToSeconds(3)

const displayItems = (
  { name }: Data,
  t: TFunction<'translation', undefined>,
): TransactionDisplayItem[] => [
  {
    label: 'name',
    value: name,
    type: 'name',
  },
  {
    label: 'action',
    value: t('transaction.extendNamePoh.actionValue', { ns: 'transactionFlow' }),
  },
  {
    label: 'duration',
    value: t('unit.years', { count: toSingleDecimal(duration) }),
  },
]

const transaction = async ({ connectorClient, data }: TransactionFunctionParameters<Data>) => {
  const { name, signature } = data

  return renewPoh.makeFunctionData(connectorClient, {
    name,
    signature,
  })
}
export default { transaction, displayItems } satisfies Transaction<Data>
