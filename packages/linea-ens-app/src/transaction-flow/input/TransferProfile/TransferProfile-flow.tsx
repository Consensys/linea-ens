import { useTranslation } from 'react-i18next'
import { useTheme } from 'styled-components'

import { Button, Dialog } from '@ensdomains/thorin'

import { InnerDialog } from '@app/components/@atoms/InnerDialog'
import { useProfile } from '@app/hooks/useProfile'
import TransactionLoader from '@app/transaction-flow/TransactionLoader'

import { useContractAddress } from '../../../hooks/chain/useContractAddress'
import { createTransactionItem } from '../../transaction/index'
import { TransactionDialogPassthrough } from '../../types'

type Data = {
  name: string
  isWrapped: boolean
}

export type Props = { data: Data } & TransactionDialogPassthrough

const TransferProfile = ({ data, dispatch }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('transactionFlow')
  const resolverAddress = useContractAddress({ contract: 'ensPublicResolver' })

  const { data: profile, isLoading } = useProfile({ name: data.name })
  const oldResolverAddress = profile?.resolverAddress

  const updateResolverTransaction = createTransactionItem('updateResolver', {
    name: data.name,
    resolverAddress,
    oldResolverAddress,
    contract: data.isWrapped ? 'nameWrapper' : 'registry',
  })

  const handleReset = () => {
    if (!resolverAddress) return
    dispatch({
      name: 'setTransactions',
      payload: [updateResolverTransaction],
    })

    dispatch({
      name: 'setFlowStage',
      payload: 'transaction',
    })
  }

  const handleTransfer = () => {
    if (!resolverAddress) return
    dispatch({
      name: 'startFlow',
      key: `edit-profile-flow-${data.name}`,
      payload: {
        transactions: [
          createTransactionItem('migrateProfile', { name: data.name }),
          updateResolverTransaction,
        ],
        resumable: true,
        disableBackgroundClick: true,
      },
    })
  }
  const footerLeading = (
    <Button
      style={{
        backgroundColor: theme.colors.backgroundSecondary,
        color: theme.colors.textSecondary,
      }}
      onClick={handleReset}
      data-testid="transfer-profile-leading-btn"
    >
      {t('action.reset', { ns: 'common' })}
    </Button>
  )

  const footerTrailing = (
    <Button onClick={handleTransfer} data-testid="transfer-profile-trailing-btn">
      {t('action.transfer', { ns: 'common' })}
    </Button>
  )

  if (isLoading) return <TransactionLoader />
  return (
    <>
      <Dialog.Heading title={t('input.transferProfile.title')} />
      <InnerDialog>
        <p>{t('input.transferProfile.message1')}</p>
        <p>
          <strong>{t('input.transferProfile.message2')}</strong>
        </p>
      </InnerDialog>
      <Dialog.Footer leading={footerLeading} trailing={footerTrailing} />
    </>
  )
}

export default TransferProfile
