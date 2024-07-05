import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

const Container = styled.div(
  ({ theme }) => css`
    padding: ${theme.space['6']} ${theme.space['12']};
    border: 1px solid ${theme.colors.border};
    display: flex;
    justify-content: center;
    gap: ${theme.space['4']};
    background-color: ${theme.colors.greySurface};
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
    font-size: ${theme.fontSizes.extraLarge};
    line-height: ${theme.space['11']};
    text-align: center;
    color: ${theme.colors.textPrimary};
  `,
)

const StatusValid = styled.label(
  ({ theme }) => css`
    display: block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-style: normal;
    font-size: ${theme.fontSizes.large};
    line-height: ${theme.space['11']};
    text-align: center;
    color: ${theme.colors.textSecondary};
    border-radius: ${theme.radii.full};
    background-color: ${theme.colors.greenActive};
    padding: ${theme.space['0']} ${theme.space['6']};
  `,
)

const StatusNotValid = styled(StatusValid)(
  ({ theme }) => css`
    background-color: ${theme.colors.orangeActive};
    color: ${theme.colors.textPrimary};
  `,
)

type Props = {
  valid: boolean
  pohAlreadyRegistered: boolean
}

export const PohStatus = ({ valid, pohAlreadyRegistered }: Props) => {
  const { t } = useTranslation('register')
  return (
    <Container data-testid="poh-status">
      <LabelContainer>
        <StatusLabel>{t('steps.pohCheck.pohStatus')}</StatusLabel>
      </LabelContainer>
      {valid && (
        <>
          {pohAlreadyRegistered ? (
            <StatusNotValid>{t('steps.pohCheck.pohAlreadyUsed')}</StatusNotValid>
          ) : (
            <StatusValid>{t('steps.pohCheck.pohValid')}</StatusValid>
          )}
        </>
      )}
      {!valid && <StatusNotValid>{t('steps.pohCheck.pohNotValid')}</StatusNotValid>}
    </Container>
  )
}
