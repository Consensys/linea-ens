import styled, { css } from 'styled-components'

import { Button as ThorinButton } from '@ensdomains/thorin'

export const Button = styled(ThorinButton)(
  ({ theme }) => css`
    background-color: ${theme.colors.backgroundSecondary};
    color: ${theme.colors.textSecondary};
    border-radius: ${theme.radii.full};

    :hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
  `,
)
