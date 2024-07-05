import styled, { css } from 'styled-components'

import { Typography as ThorinTypography } from '@ensdomains/thorin'

export const Typography = styled(ThorinTypography)(
  ({ theme }) => css`
    color: ${theme.colors.textPrimary};
  `,
)
