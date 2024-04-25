import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import type { Address, Hex } from 'viem'
import { useBalance } from 'wagmi'
import { GetBalanceData } from 'wagmi/query'

import { Button, Heading, mq, Typography } from '@ensdomains/thorin'

import MobileFullWidth from '@app/components/@atoms/MobileFullWidth'
import { PlusMinusControl } from '@app/components/@atoms/PlusMinusControl/PlusMinusControl'
import { PohStatus } from '@app/components/@molecules/PohStatus/PohStatus'
import { Card } from '@app/components/Card'
import { ConnectButton } from '@app/components/ConnectButton'
import { useAccountSafely } from '@app/hooks/account/useAccountSafely'
import { useContractAddress } from '@app/hooks/chain/useContractAddress'
import { useEstimateFullRegistrationPoh } from '@app/hooks/gasEstimation/useEstimateRegistrationPoh'
import { usePohRegistered } from '@app/hooks/usePohRegistered'

import { PaymentMethod, RegistrationReducerDataItem, RegistrationStepData } from '../../types'

const StyledCard = styled(Card)(
  ({ theme }) => css`
    max-width: 780px;
    margin: 0 auto;
    flex-direction: column;
    gap: ${theme.space['4']};
    padding: ${theme.space['4']};

    ${mq.sm.min(css`
      padding: ${theme.space['6']} ${theme.space['18']};
      gap: ${theme.space['6']};
    `)}
  `,
)

const StyledHeading = styled(Heading)(
  () => css`
    width: 100%;
    word-break: break-all;

    @supports (overflow-wrap: anywhere) {
      overflow-wrap: anywhere;
      word-break: normal;
    }
  `,
)

const PohExplainer = styled(Typography)(
  () => css`
    grid-area: description;
  `,
)

const GetPoh = styled(Typography)(
  () => css`
    grid-area: description;
  `,
)

export type ActionButtonProps = {
  address?: Address
  reverseRecord: boolean
  callback: (props: RegistrationStepData['pricing']) => void
  years: number
  balance: GetBalanceData | undefined
  totalRequiredBalance?: bigint
  pohValid: boolean
  pohAlreadyRegistered: boolean
}

export const ActionButton = ({
  address,
  reverseRecord,
  callback,
  years,
  balance,
  totalRequiredBalance,
  pohValid,
  pohAlreadyRegistered,
}: ActionButtonProps) => {
  const { t } = useTranslation('register')

  if (!address) {
    return <ConnectButton large />
  }
  if (!pohValid) {
    return (
      <Button data-testid="next-button" disabled>
        {t('steps.pohCheck.pohNotValid')}
      </Button>
    )
  }
  if (pohAlreadyRegistered) {
    return (
      <Button data-testid="next-button" disabled>
        {t('steps.pohCheck.pohAlreadyUsed')}
      </Button>
    )
  }
  if (typeof balance?.value !== 'bigint' || !totalRequiredBalance) {
    return (
      <Button data-testid="next-button" disabled>
        {t('loading', { ns: 'common' })}
      </Button>
    )
  }
  if (typeof balance?.value === 'bigint' && balance.value < totalRequiredBalance) {
    return (
      <Button data-testid="next-button" disabled>
        {t('steps.pricing.insufficientBalance')}
      </Button>
    )
  }
  return (
    <Button
      data-testid="next-button"
      onClick={() =>
        callback({ reverseRecord, years, paymentMethodChoice: PaymentMethod.ethereum })
      }
    >
      {t('action.next', { ns: 'common' })}
    </Button>
  )
}

export type PricingProps = {
  name: string
  beautifiedName: string

  resolverExists: boolean | undefined
  callback: (props: RegistrationStepData['pricing']) => void
  hasPrimaryName: boolean
  registrationData: RegistrationReducerDataItem
  pohSignature: Hex | undefined
}

const PohCheck = ({
  name,
  beautifiedName,
  callback,
  hasPrimaryName,
  registrationData,
  resolverExists,
  pohSignature,
}: PricingProps) => {
  const { t } = useTranslation('register')

  const { address } = useAccountSafely()
  const { data: balance } = useBalance({ address })
  const resolverAddress = useContractAddress({ contract: 'ensPublicResolver' })

  const [years, setYears] = useState(registrationData.years)
  const [reverseRecord] = useState(() =>
    registrationData.started ? registrationData.reverseRecord : !hasPrimaryName,
  )
  const { data: pohAlreadyRegistered } = usePohRegistered(address)

  const fullEstimate = useEstimateFullRegistrationPoh({
    name,
    registrationData: {
      ...registrationData,
      reverseRecord,
      years,
      records: [{ key: 'ETH', value: resolverAddress, type: 'addr', group: 'address' }],
      clearRecords: resolverExists,
      resolverAddress,
    },
    pohSignature,
  })
  const { estimatedGasFee } = fullEstimate

  const totalRequiredBalance = estimatedGasFee || 0n

  return (
    <StyledCard>
      <StyledHeading>{t('heading', { name: beautifiedName })}</StyledHeading>
      <PlusMinusControl
        minValue={3}
        maxValue={3}
        value={years}
        onChange={(e) => {
          const newYears = parseInt(e.target.value)
          if (!Number.isNaN(newYears)) setYears(newYears)
        }}
        disabled
        highlighted
      />
      <PohExplainer>{t('steps.pohCheck.pohExplainer')}</PohExplainer>
      <PohStatus valid={!!pohSignature} />
      {!pohSignature && (
        <GetPoh>
          {t('steps.pohCheck.getPoh')}{' '}
          <Link href="https://poh.linea.build/" target="_blank">
            {t('steps.pohCheck.getPohHereLink')}
          </Link>
        </GetPoh>
      )}

      <MobileFullWidth>
        <ActionButton
          {...{
            address,
            reverseRecord,
            callback,
            years,
            balance,
            totalRequiredBalance,
            pohValid: !!pohSignature,
            pohAlreadyRegistered: pohAlreadyRegistered || false,
          }}
        />
      </MobileFullWidth>
    </StyledCard>
  )
}

export default PohCheck
