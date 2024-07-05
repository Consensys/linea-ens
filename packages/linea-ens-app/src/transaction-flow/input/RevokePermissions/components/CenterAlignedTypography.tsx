import styled, { css } from 'styled-components'

import { Typography } from '@app/components/styled/Typography'

export const CenterAlignedTypography = styled(Typography)(
  () => css`
    text-align: center;
  `,
)
