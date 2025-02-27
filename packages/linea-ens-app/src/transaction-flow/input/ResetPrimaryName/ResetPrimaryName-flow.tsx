import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'
import type { Address } from 'viem'

import { Button, Dialog } from '@ensdomains/thorin'

import { InnerDialog } from '@app/components/@atoms/InnerDialog'

import { createTransactionItem } from '../../transaction'
import { TransactionDialogPassthrough } from '../../types'

type Data = {
  address: Address
  name: string
}

export type Props = {
  data: Data
} & TransactionDialogPassthrough

const StyledInnerDialog = styled(InnerDialog)(
  () => css`
    text-align: center;
  `,
)

const ResetPrimaryName = ({ data: { address }, dispatch, onDismiss }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('transactionFlow')

  const handleSubmit = async () => {
    dispatch({
      name: 'setTransactions',
      payload: [
        createTransactionItem('resetPrimaryName', {
          address,
        }),
      ],
    })
    dispatch({
      name: 'setFlowStage',
      payload: 'transaction',
    })
  }

  return (
    <>
      <Dialog.Heading alert="warning" title={t('input.resetPrimaryName.title')} />
      <StyledInnerDialog>{t('input.resetPrimaryName.description')}</StyledInnerDialog>
      <Dialog.Footer
        leading={
          <Button
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.textSecondary,
            }}
            onClick={onDismiss}
          >
            {t('action.cancel', { ns: 'common' })}
          </Button>
        }
        trailing={
          <Button data-testid="primary-next" onClick={handleSubmit}>
            {t('action.next', { ns: 'common' })}
          </Button>
        }
      />
    </>
  )
}

export default ResetPrimaryName
