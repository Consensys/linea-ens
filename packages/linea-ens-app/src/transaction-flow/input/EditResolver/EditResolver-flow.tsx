import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'
import { Address } from 'viem'

import { mq } from '@ensdomains/thorin'

import EditResolverForm from '@app/components/@molecules/EditResolver/EditResolverForm'
import EditResolverWarnings from '@app/components/@molecules/EditResolver/EditResolverWarnings'
import { Dialog } from '@app/components/@organisms/Dialog/Dialog'
import { Button } from '@app/components/styled/Button'
import { useIsWrapped } from '@app/hooks/useIsWrapped'
import { useProfile } from '@app/hooks/useProfile'
import useResolverEditor from '@app/hooks/useResolverEditor'
import { TransactionDialogPassthrough } from '@app/transaction-flow/types'

import { createTransactionItem } from '../../transaction'

const EditResolverFormContainer = styled.div(({ theme }) => [
  css`
    width: 100%;
  `,
  mq.sm.min(css`
    width: calc(80vw - 2 * ${theme.space['6']});
    max-width: ${theme.space['128']};
  `),
])

type Data = {
  name: string
}

export type Props = {
  data: Data
} & TransactionDialogPassthrough

export const EditResolver = ({ data, dispatch, onDismiss }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('transactionFlow')

  const { name } = data
  const { data: isWrapped } = useIsWrapped({ name })
  const formRef = useRef<HTMLFormElement>(null)

  const { data: profile = { resolverAddress: '' } } = useProfile({ name: name as string })
  const { resolverAddress } = profile

  const handleCreateTransaction = useCallback(
    (newResolver: Address) => {
      dispatch({
        name: 'setTransactions',
        payload: [
          createTransactionItem('updateResolver', {
            name,
            contract: isWrapped ? 'nameWrapper' : 'registry',
            resolverAddress: newResolver,
          }),
        ],
      })
      dispatch({ name: 'setFlowStage', payload: 'transaction' })
    },
    [dispatch, name, isWrapped],
  )

  const editResolverForm = useResolverEditor({ resolverAddress, callback: handleCreateTransaction })
  const { hasErrors } = editResolverForm

  const handleSubmitForm = () => {
    formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  }

  return (
    <>
      <Dialog.Heading title={t('input.editResolver.title')} />
      <EditResolverFormContainer>
        <EditResolverWarnings {...editResolverForm} />
        <EditResolverForm {...{ ...editResolverForm, resolverAddress, formRef }} />
      </EditResolverFormContainer>
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
          <Button onClick={handleSubmitForm} disabled={hasErrors} data-testid="update-button">
            {t('action.update', { ns: 'common' })}
          </Button>
        }
      />
    </>
  )
}

export default EditResolver
