import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { useAccount, useEnsAvatar } from 'wagmi'

import { Avatar, Button, Dialog, mq, ScrollBox, Typography } from '@ensdomains/thorin'

import { PlusMinusControl } from '@app/components/@atoms/PlusMinusControl/PlusMinusControl'
import { StyledName } from '@app/components/@atoms/StyledName/StyledName'
import { useEstimateGasWithStateOverride } from '@app/hooks/chain/useEstimateGasWithStateOverride'
import { useExpiry } from '@app/hooks/ensjs/public/useExpiry'
import { usePohSignature } from '@app/hooks/usePohStatus'
import { useZorb } from '@app/hooks/useZorb'
import { createTransactionItem } from '@app/transaction-flow/transaction'
import { TransactionDialogPassthrough } from '@app/transaction-flow/types'
import { ensAvatarConfig } from '@app/utils/query/ipfsGateway'

import { ShortExpiry } from '../../../components/@atoms/ExpiryComponents/ExpiryComponents'

type View = 'name-list' | 'no-ownership-warning' | 'registration'

const Container = styled.form(
  ({ theme }) => css`
    display: flex;
    width: 100%;
    max-height: 60vh;
    flex-direction: column;
    align-items: center;
    gap: ${theme.space['4']};

    ${mq.sm.min(css`
      width: calc(80vw - 2 * ${theme.space['6']});
      max-width: ${theme.space['128']};
    `)}
  `,
)

const ScrollBoxWrapper = styled(ScrollBox)(
  ({ theme }) => css`
    width: 100%;
    padding-right: ${theme.space['2']};
    margin-right: -${theme.space['2']};
  `,
)

const InnerContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.space['4']};
  `,
)

const PlusMinusWrapper = styled.div(({ theme }) => [
  css`
    width: 100%;
    max-width: ${theme.space['80']};
    overflow: hidden;
    display: flex;
  `,
  mq.sm.min(css``),
])

const NamesListItemContainer = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${theme.space['2']};
    height: ${theme.space['16']};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.radii.full};
    padding: ${theme.space['2']};
    padding-right: ${theme.space['5']};
  `,
)

const NamesListItemAvatarWrapper = styled.div(
  ({ theme }) => css`
    position: relative;
    width: ${theme.space['12']};
    height: ${theme.space['12']};
  `,
)

const NamesListItemContent = styled.div(
  () => css`
    flex: 1;
    position: relative;
    overflow: hidden;
  `,
)

const NamesListItemTitle = styled.div(
  ({ theme }) => css`
    font-size: ${theme.space['5.5']};
    background: 'red';
  `,
)

const NamesListItemSubtitle = styled.div(
  ({ theme }) => css`
    font-weight: ${theme.fontWeights.normal};
    font-size: ${theme.space['3.5']};
    line-height: 1.43;
    color: ${theme.colors.textTertiary};
  `,
)

const CenteredMessage = styled(Typography)(
  () => css`
    text-align: center;
  `,
)

const NamesListItem = ({ name }: { name: string }) => {
  const { data: avatar } = useEnsAvatar({ ...ensAvatarConfig, name })
  const zorb = useZorb(name, 'name')
  const { data: expiry, isLoading: isExpiryLoading } = useExpiry({ name })

  if (isExpiryLoading) return null
  return (
    <NamesListItemContainer>
      <NamesListItemAvatarWrapper>
        <Avatar src={avatar || zorb} label={name} />
      </NamesListItemAvatarWrapper>
      <NamesListItemContent>
        <NamesListItemTitle>
          <StyledName name={name} />
        </NamesListItemTitle>
        {expiry?.expiry && (
          <NamesListItemSubtitle>
            <ShortExpiry expiry={expiry.expiry.date} textOnly />
          </NamesListItemSubtitle>
        )}
      </NamesListItemContent>
    </NamesListItemContainer>
  )
}

const NamesListContainer = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: ${theme.space['2']};
  `,
)

type NamesListProps = {
  names: string[]
}

const NamesList = ({ names }: NamesListProps) => {
  return (
    <NamesListContainer data-testid="extend-names-names-list">
      {names.map((name) => (
        <NamesListItem key={name} name={name} />
      ))}
    </NamesListContainer>
  )
}

type Data = {
  names: string[]
  isSelf?: boolean
}

export type Props = {
  data: Data
} & TransactionDialogPassthrough

const ExtendNamePoh = ({ data: { names, isSelf }, dispatch, onDismiss }: Props) => {
  const { t } = useTranslation('transactionFlow')

  const { address } = useAccount()

  const flow: View[] = useMemo(
    () =>
      match([names.length, isSelf])
        .with([P.when((length) => length > 1), true], () => ['name-list', 'registration'] as View[])
        .with(
          [P.when((length) => length > 1), P._],
          () => ['no-ownership-warning', 'name-list', 'registration'] as View[],
        )
        .with([P._, true], () => ['registration'] as View[])
        .otherwise(() => ['no-ownership-warning', 'registration'] as View[]),
    [names.length, isSelf],
  )
  const [viewIdx, setViewIdx] = useState(1)
  const incrementView = () => setViewIdx(() => Math.min(flow.length - 1, viewIdx + 1))
  const decrementView = () => (viewIdx <= 0 ? onDismiss() : setViewIdx(viewIdx - 1))
  const view = flow[viewIdx]

  const [years] = useState(3)

  const pohSignature = usePohSignature(address)

  const transactions = pohSignature
    ? [createTransactionItem('extendNamePoh', { name: names[0], signature: pohSignature })]
    : []

  const { error: estimateGasLimitError, isLoading: isEstimateGasLoading } =
    useEstimateGasWithStateOverride({
      transactions: pohSignature
        ? [
            {
              name: 'extendNamePoh',
              data: {
                name: names[0],
                signature: pohSignature,
              },
            },
          ]
        : [],
      enabled: !!pohSignature,
    })

  const { title, alert } = match(view)
    .with('no-ownership-warning', () => ({
      title: t('input.extendNames.ownershipWarning.title', { count: names.length }),
      alert: 'warning' as const,
    }))
    .otherwise(() => ({
      title: t('input.extendNames.title', { count: names.length }),
      alert: undefined,
    }))

  const trailingButtonProps = match(view)
    .with('name-list', () => ({
      onClick: incrementView,
      children: t('action.next', { ns: 'common' }),
    }))
    .with('no-ownership-warning', () => ({
      onClick: incrementView,
      children: t('action.understand', { ns: 'common' }),
    }))
    .otherwise(() => ({
      disabled: !!estimateGasLimitError,
      onClick: () => {
        dispatch({ name: 'setTransactions', payload: transactions })
        dispatch({ name: 'setFlowStage', payload: 'transaction' })
      },
      children: t('action.next', { ns: 'common' }),
    }))

  return (
    <Container data-testid="extend-names-modal">
      <Dialog.Heading title={title} alert={alert} />
      <ScrollBoxWrapper>
        <InnerContainer>
          {match(view)
            .with('name-list', () => <NamesList names={names} />)
            .with('no-ownership-warning', () => (
              <CenteredMessage>
                {t('input.extendNames.ownershipWarning.description', { count: names.length })}
              </CenteredMessage>
            ))
            .otherwise(() => (
              <>
                <PlusMinusWrapper>
                  <PlusMinusControl value={years} disabled />
                </PlusMinusWrapper>
              </>
            ))}
        </InnerContainer>
      </ScrollBoxWrapper>
      <Dialog.Footer
        leading={
          <Button colorStyle="accentSecondary" onClick={decrementView}>
            {t(viewIdx === 0 ? 'action.cancel' : 'action.back', { ns: 'common' })}
          </Button>
        }
        trailing={
          <Button
            {...trailingButtonProps}
            data-testid="extend-names-confirm"
            disabled={isEstimateGasLoading}
          />
        }
      />
    </Container>
  )
}

export default ExtendNamePoh
