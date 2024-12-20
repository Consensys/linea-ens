import { UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { ChildFuseKeys, ChildFuseReferenceType } from '@ensdomains/ensjs/utils'

import { CheckboxRow } from '@app/components/@molecules/CheckBoxRow/CheckBoxRow'
import { Dialog } from '@app/components/@organisms/Dialog/Dialog'

import type { FormData } from '../RevokePermissions-flow'

type Props = {
  register: UseFormRegister<FormData>
  unburnedFuses: ChildFuseReferenceType['Key'][]
}

const CHILD_FUSES_WITHOUT_CU_AND_CBF = ChildFuseKeys.filter(
  (fuse) => !['CANNOT_UNWRAP', 'CANNOT_BURN_FUSES'].includes(fuse),
)

const PermissionsList = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.space[2]};
  `,
)

export const RevokePermissionsView = ({ register, unburnedFuses }: Props) => {
  const { t } = useTranslation('transactionFlow')

  const { burned, unburned } = CHILD_FUSES_WITHOUT_CU_AND_CBF.reduce<{
    burned: ChildFuseReferenceType['Key'][]
    unburned: ChildFuseReferenceType['Key'][]
  }>(
    (filteredFuses, fuse) => {
      const isUnburned = unburnedFuses.includes(fuse)
      if (isUnburned) filteredFuses.unburned.push(fuse)
      else filteredFuses.burned.push(fuse)
      return filteredFuses
    },
    { burned: [], unburned: [] },
  )

  return (
    <>
      <Dialog.Heading title={t('input.revokePermissions.views.revokePermissions.title')} />
      <PermissionsList>
        {unburned.map((fuse) => (
          <CheckboxRow
            data-testid={`checkbox-${fuse}`}
            key={fuse}
            label={t(`input.revokePermissions.views.revokePermissions.fuses.${fuse}`)}
            {...register(`childFuses.${fuse}`)}
          />
        ))}
        {burned.map((fuse) => (
          <CheckboxRow
            data-testid={`checkbox-${fuse}`}
            key={fuse}
            label={t(`input.revokePermissions.views.revokePermissions.fuses.${fuse}`)}
            disabled
            {...register(`childFuses.${fuse}`)}
          />
        ))}
      </PermissionsList>
    </>
  )
}
