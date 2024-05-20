import styled, { css } from 'styled-components'

import { Button, mq, Typography } from '@ensdomains/thorin'

import LineaLogo from '@app/assets/linea/LineaLogoWhite.svg'

import { Card } from '../Card'

const Container = styled(Card)(
  ({ theme }) => css`
    flex-direction: row;
    justify-content: space-between;
    gap: ${theme.space['2']};
    padding: ${theme.space['4']};
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
  return (
    <Container>
      <Row>
        <LineaLogo />
        <div>
          <Typography color="textPrimary" fontVariant="largeBold" weight="bold">
            Learn more on our Mirror post
          </Typography>
        </div>
      </Row>
      {/* TODO: Replace link to linea mirror link */}
      <Button
        as="a"
        width="max"
        colorStyle="blueSecondary"
        href="https://aboutus.godaddy.net/newsroom/company-news/news-details/2024/GoDaddy-and-Ethereum-Name-Service-Bridge-the-Gap-Between-Domain-Names-and-Crypto-Wallets/default.aspx?utm_source=Social&utm_medium=Twitter&utm_campaign=GoDaddy-and-Ethereum-Name-Service-Bridge-the-Gap-Between-Domain-Names-and-Crypto-Wallets/default.aspx"
        target="_blank"
      >
        Learn More
      </Button>
    </Container>
  )
}
