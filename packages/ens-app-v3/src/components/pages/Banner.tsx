import styled, { css, useTheme } from 'styled-components'

import { Button, mq, Typography } from '@ensdomains/thorin'

import LineaLogo from '@app/assets/linea/LineaLogoWhite.svg'

import { Card } from '../Card'

const Container = styled(Card)(
  ({ theme }) => css`
    flex-direction: row;
    justify-content: space-between;
    gap: ${theme.space['2']};
    padding: ${theme.space['4']};
    background-color: ${theme.colors.backgroundPrimary};
    ${mq.sm.max(css`
      width: 100%;
      flex-direction: column;
      a {
        width: 100%;
      }
    `)}
  `,
)

const Row = styled.div(
  ({}) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    ${mq.sm.max(css`
      justify-content: center;
    `)}
  `,
)

export const Banner = () => {
  const theme = useTheme()
  return (
    <Container>
      <Row>
        <LineaLogo />
        <div>
          <Typography
            fontVariant="largeBold"
            weight="bold"
            style={{ color: theme.colors.textPrimary }}
          >
            Learn more on our Mirror post
          </Typography>
        </div>
      </Row>
      {/* TODO: Replace link to linea mirror link */}
      <Button
        as="a"
        width="max"
        style={{
          backgroundColor: theme.colors.backgroundSecondary,
          color: theme.colors.textSecondary,
        }}
        href="https://aboutus.godaddy.net/newsroom/company-news/news-details/2024/GoDaddy-and-Ethereum-Name-Service-Bridge-the-Gap-Between-Domain-Names-and-Crypto-Wallets/default.aspx?utm_source=Social&utm_medium=Twitter&utm_campaign=GoDaddy-and-Ethereum-Name-Service-Bridge-the-Gap-Between-Domain-Names-and-Crypto-Wallets/default.aspx"
        target="_blank"
      >
        Learn More
      </Button>
    </Container>
  )
}
