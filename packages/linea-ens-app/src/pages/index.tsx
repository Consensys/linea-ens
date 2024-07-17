import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'

import { mq, Typography } from '@ensdomains/thorin'

import FaucetBanner from '@app/components/@molecules/FaucetBanner'
import Hamburger from '@app/components/@molecules/Hamburger/Hamburger'
import { SearchInput } from '@app/components/@molecules/SearchInput/SearchInput'
import { LeadingHeading } from '@app/components/LeadingHeading'
import { Banner } from '@app/components/pages/Banner'
import LineaLogo from '../assets/linea/LineaLogoMobile.svg'
import LineLogo from '../assets/linea/LineLogo.svg'
import ENSLogo from '../assets/linea/ENSLogo.svg'

import { useAccount } from 'wagmi'

// import ENSFull from '../assets/ENSFull.svg'

const GradientTitle = styled.h1(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingTwo};
    text-align: center;
    font-weight: 800;
    background-repeat: no-repeat;
    background-size: 110%;
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -webkit-background-clip: text;
    background-clip: text;
    margin: 0;
    color: ${theme.colors.textAccent};

    ${mq.sm.min(css`
      font-size: ${theme.fontSizes.headingOne};
    `)}
  `,
)

const SubtitleWrapper = styled.div(
  ({ theme }) => css`
    max-width: calc(${theme.space['72']} * 2 - ${theme.space['4']});
    line-height: 150%;
    text-align: center;
    margin-bottom: ${theme.space['3']};
  `,
)

const Container = styled.div(
  () => css`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  `,
)

const Stack = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-gap: ${theme.space['3']};
    gap: ${theme.space['3']};
  `,
)

const StyledENS = styled.div(
  ({ theme }) => css`
    height: ${theme.space['8.5']};
  `,
)

const LogoAndLanguage = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
    width: 50%;
  `,
)

const StyledLeadingHeading = styled(LeadingHeading)(
  () => css`
    ${mq.sm.min(css`
      display: none;
    `)}
  `,
)

export default function Page() {
  const { t } = useTranslation('common')
  const { isConnected } = useAccount()

  return (
    <>
      <Head>
        <title>Linea ENS</title>
      </Head>
      <StyledLeadingHeading>
        <LogoAndLanguage>
          <LineaLogo />
          <LineLogo height="27.5" />
          <ENSLogo />
          {/* <StyledENS as={ENSFull} /> */}
        </LogoAndLanguage>
        {
          isConnected && <Hamburger />
        }
      </StyledLeadingHeading>
      <FaucetBanner />
      <Container>
        <Stack>
          <GradientTitle>{t('title')}</GradientTitle>
          <SubtitleWrapper>
            <Typography fontVariant="large" color="grey">
              {t('description')}
            </Typography>
          </SubtitleWrapper>
          <SearchInput />
          <Banner />
        </Stack>
      </Container>
    </>
  )
}
