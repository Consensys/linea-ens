import styled, { css } from 'styled-components'

import { Typography } from './Typography'

export const DialogHeading = styled(Typography)(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingFour};
    text-align: center;
  `,
)
