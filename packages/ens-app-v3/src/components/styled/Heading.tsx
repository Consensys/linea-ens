import styled, { css } from 'styled-components'

import { Heading as ThorinHeading } from '@ensdomains/thorin'

export const Heading = styled(ThorinHeading)(
  ({ theme }) => css`
    color: ${theme.colors.textPrimary};
  `,
)
