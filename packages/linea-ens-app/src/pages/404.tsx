import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { mq } from '@ensdomains/thorin'

import ENSLogo from '@app/assets/linea/ENSLogo.svg'
import LineaLogo from '@app/assets/linea/LineaLogoMobile.svg'
import LineLogo from '@app/assets/linea/LineLogo.svg'
import ErrorScreen from '@app/components/@atoms/ErrorScreen'
import { LeadingHeading } from '@app/components/LeadingHeading'

const LogoAndLanguage = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
    width: 40%;
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
  const { t } = useTranslation()
  return (
    <>
      <Head>
        {/* this is wrapped in a string because of the way nextjs renders content, don't remove! */}
        <title>{`ENS - ${t('notFound')}`}</title>
      </Head>
      <StyledLeadingHeading>
        <LogoAndLanguage>
          <LineaLogo />
          <LineLogo height="27.5" />
          <ENSLogo width="91" height="80" />
        </LogoAndLanguage>
      </StyledLeadingHeading>
      <ErrorScreen errorType="not-found" />
    </>
  )
}
