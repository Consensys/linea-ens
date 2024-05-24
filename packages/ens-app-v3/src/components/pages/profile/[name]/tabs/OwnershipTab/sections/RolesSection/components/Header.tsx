import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'

import { Tag, Typography } from '@ensdomains/thorin'

const Container = styled.div(
  () => css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  `,
)

export const Header = ({ count }: { count: number }) => {
  const theme = useTheme()
  const { t } = useTranslation('profile')
  return (
    <Container>
      <Typography
        fontVariant="headingTwo"
        style={{
          color: theme.colors.textPrimary,
        }}
      >
        {t('tabs.ownership.sections.roles.title')}
      </Typography>
      <Tag
        size="small"
        style={{
          backgroundColor: theme.colors.grey,
          color: theme.colors.textSecondary,
        }}
      >
        {t('tabs.ownership.sections.roles.addresses', { count })}
      </Tag>
    </Container>
  )
}
