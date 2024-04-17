import styled, { css } from 'styled-components'

import CheckCircle from '@app/assets/CheckCircle.svg'
import MinusCircle from '@app/assets/MinusCircle.svg'

const Container = styled.div(
  ({ theme }) => css`
    width: 100%;
    padding: ${theme.space['1']};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.radii.full};
    display: flex;
    justify-content: center;
    gap: ${theme.space['4']};
  `,
)

const LabelContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    height: ${theme.space['11']};
    border-radius: ${theme.radii.full};
    background-color: transparent;
    overflow: hidden;
  `,
)

const StatusLabel = styled.label(
  ({ theme }) => css`
    height: ${theme.space['11']};
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-style: normal;
    font-weight: ${theme.fontWeights.bold};
    font-size: ${theme.fontSizes.headingTwo};
    line-height: ${theme.space['11']};
    text-align: center;
    color: ${theme.colors.bluePrimary};
  `,
)

const NotValidImg = styled.div(
  ({ theme }) => css`
    height: ${theme.space['11']};
    width: ${theme.space['11']};
    border-radius: 50%;
    background: ${theme.colors.background};
    display: flex;
    justify-content: center;
    align-items: center;
    svg {
      display: block;
      transform: scale(1);
      pointer-events: none;
      path {
        fill: ${theme.colors.red};
      }
    }
  `,
)

const ValidImg = styled.div(
  ({ theme }) => css`
    height: ${theme.space['11']};
    width: ${theme.space['11']};
    border-radius: 50%;
    background: ${theme.colors.greenBright};
    display: flex;
    justify-content: center;
    align-items: center;
    svg {
      display: block;
      transform: scale(1);
      pointer-events: none;
      path {
        fill: ${theme.colors.greenBright};
      }
    }
  `,
)

type Props = {
  valid: boolean
}

export const PohStatus = ({ valid }: Props) => {
  return (
    <Container data-testid="poh-status">
      <LabelContainer>
        <StatusLabel>Linea PoH status:</StatusLabel>
      </LabelContainer>
      {valid && (
        <ValidImg>
          <CheckCircle />
        </ValidImg>
      )}

      {!valid && (
        <NotValidImg>
          <MinusCircle />
        </NotValidImg>
      )}
    </Container>
  )
}
