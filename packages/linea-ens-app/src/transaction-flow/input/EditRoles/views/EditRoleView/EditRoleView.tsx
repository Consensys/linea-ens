import { useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'
import { match, P } from 'ts-pattern'

import { Input, MagnifyingGlassSimpleSVG, mq } from '@ensdomains/thorin'

import { Dialog } from '@app/components/@organisms/Dialog/Dialog'
import { Button } from '@app/components/styled/Button'
import { SearchViewErrorView } from '@app/transaction-flow/input/SendName/views/SearchView/views/SearchViewErrorView'
import { SearchViewLoadingView } from '@app/transaction-flow/input/SendName/views/SearchView/views/SearchViewLoadingView'
import { SearchViewNoResultsView } from '@app/transaction-flow/input/SendName/views/SearchView/views/SearchViewNoResultsView'

import { EditRolesFooter } from '../../components/EditRolesFooter'
import type { EditRolesForm } from '../../EditRoles-flow'
import { useSimpleSearch } from '../../hooks/useSimpleSearch'
import { EditRoleIntroView } from './views/EditRoleIntroView'
import { EditRoleResultsView } from './views/EditRoleResultsView'

const SubviewContainer = styled.div(({ theme }) => [
  css`
    flex: 1;
    width: calc(100% + 2 * ${theme.space['4']});
    margin: 0 -${theme.space['4']};
    min-height: ${theme.space['40']};
  `,
  mq.sm.min(css`
    width: calc(100% + 2 * ${theme.space['6']});
    margin: 0 -${theme.space['6']};
  `),
])

const Content = styled.div(({ theme }) => [
  css`
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
  `,
  mq.sm.min(css`
    margin: 0 -${theme.space['6']};
  `),
])

type Props = {
  index: number
  onBack: () => void
}

export const EditRoleView = ({ index, onBack }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('transactionFlow')

  const [query, setQuery] = useState('')
  const search = useSimpleSearch()

  const { control } = useFormContext<EditRolesForm>()
  const { fields: roles, update } = useFieldArray<EditRolesForm>({
    control,
    name: 'roles',
  })
  const currentRole = roles[index]

  return (
    <>
      <Dialog.Heading
        title={t(`input.editRoles.views.editRole.title`, {
          role: t(`roles.${currentRole.role}.title`, { ns: 'common' }),
        })}
      />
      <Content>
        <Input
          data-testid="edit-roles-search-input"
          name="role"
          label="Role"
          size="medium"
          hideLabel
          icon={<MagnifyingGlassSimpleSVG />}
          clearable
          value={query}
          placeholder={t('input.sendName.views.search.placeholder')}
          onChange={(e) => {
            const newQuery = e.currentTarget.value
            setQuery(newQuery)
            if (newQuery.length < 3) return
            search.mutate(newQuery)
          }}
        />
        <SubviewContainer>
          {match([query, search])
            .with([P._, { isError: true }], () => <SearchViewErrorView />)
            .with([P.when((s) => s.length < 3), P._], () => (
              <EditRoleIntroView
                role={currentRole.role}
                address={currentRole.address}
                onSelect={(newRole) => {
                  onBack()
                  update(index, newRole)
                }}
              />
            ))
            .with([P._, { isSuccess: false }], () => <SearchViewLoadingView />)
            .with(
              [P._, { isSuccess: true, data: P.when((d) => !!d && d.length > 0) }],
              ([, { data }]) => (
                <EditRoleResultsView
                  role={currentRole.role}
                  roles={roles}
                  results={data}
                  onSelect={(newRole) => {
                    onBack()
                    update(index, newRole)
                  }}
                />
              ),
            )
            .with([P._, { isSuccess: true, data: P.when((d) => !d || d.length === 0) }], () => (
              <SearchViewNoResultsView />
            ))
            .otherwise(() => null)}
        </SubviewContainer>
        <EditRolesFooter
          trailing={
            <Button
              style={{
                backgroundColor: theme.colors.backgroundSecondary,
                color: theme.colors.textSecondary,
              }}
              onClick={onBack}
            >
              {t('action.cancel', { ns: 'common' })}
            </Button>
          }
        />
      </Content>
    </>
  )
}
