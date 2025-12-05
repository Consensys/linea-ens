import styled, { css } from 'styled-components'

import { Card, mq } from '@ensdomains/thorin'

import {
  CacheableComponentProps,
  cacheableComponentStyles,
} from '@app/components/@atoms/CacheableComponent'
import { useNameDetails } from '@app/hooks/useNameDetails'

import { ExpiryPanel } from './components/ExpiryPanel'
import { useExpiryDetails } from './hooks/useExpiryDetails'

const Header = styled.div(({ theme }) => [
  css`
    padding: ${theme.space['4']};
    border-bottom: 1px solid ${theme.colors.border};
  `,
  mq.sm.min(css`
    padding: ${theme.space['6']};
  `),
])

const PanelsContainer = styled.div(({ theme }) => [
  css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin: -${theme.space['4']} 0;
    > *:last-child {
      border-bottom: none;
    }
  `,
  mq.lg.min(css`
    flex-direction: row;
    margin: 0 -${theme.space['4']};
    > *:last-child {
      border-right: none;
    }
  `),
])

const Container = styled.div(({ theme }) => [
  css`
    display: flex;
    flex-direction: column;
    margin: -${theme.space['4']};
  `,
  mq.sm.min(css`
    margin: -${theme.space['6']};
  `),
])

const StyledCard = styled(Card)<CacheableComponentProps>`
  ${cacheableComponentStyles}
`

type Props = {
  name: string
  details: ReturnType<typeof useNameDetails>
}

export const ExpirySection = ({ name, details }: Props) => {
  const expiry = useExpiryDetails({ name, details })

  if (!expiry.data || expiry.data?.length === 0) return null

  return (
    <>
      <StyledCard $isCached={expiry.isCachedData}>
        <Container>
          <Header>
            <PanelsContainer>
              {expiry.data.map((item) => (
                <ExpiryPanel key={item.type} {...(item as any)} />
              ))}
            </PanelsContainer>
          </Header>
        </Container>
      </StyledCard>
    </>
  )
}
