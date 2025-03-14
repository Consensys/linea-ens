import { UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CheckboxRow } from '@ensdomains/thorin'

import { Dialog } from '@app/components/@organisms/Dialog/Dialog'

import { CenterAlignedTypography } from '../components/CenterAlignedTypography'
import type { FormData } from '../RevokePermissions-flow'

type Props = {
  register: UseFormRegister<FormData>
}

export const RevokeChangeFusesView = ({ register }: Props) => {
  const { t } = useTranslation('transactionFlow')

  return (
    <>
      <Dialog.Heading title={t('input.revokePermissions.views.revokeChangeFuses.title')} />
      <CenterAlignedTypography>
        {t('input.revokePermissions.views.revokeChangeFuses.subtitle')}
      </CenterAlignedTypography>
      <CheckboxRow
        data-testid="checkbox-CANNOT_BURN_FUSES"
        label={t('input.revokePermissions.views.revokeChangeFuses.fuses.CANNOT_BURN_FUSES')}
        {...register('childFuses.CANNOT_BURN_FUSES')}
      />
    </>
  )
}
