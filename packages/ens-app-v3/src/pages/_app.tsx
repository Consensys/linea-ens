import { darkTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'

import '@rainbow-me/rainbowkit/styles.css'

import { NextPage } from 'next'
import type { AppProps } from 'next/app'
import Image from 'next/image'
import { ReactElement, ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createGlobalStyle, keyframes, ThemeProvider } from 'styled-components'

import { DefaultTheme, ThorinGlobalStyles, darkTheme as thorinLightTheme } from '@ensdomains/thorin'

import LineaVector from '@app/assets/linea/LineaVector.png'
import { Notifications } from '@app/components/Notifications'
import { TestnetWarning } from '@app/components/TestnetWarning'
import { TransactionStoreProvider } from '@app/hooks/transactions/TransactionStoreContext'
import { Basic } from '@app/layouts/Basic'
import { TransactionFlowProvider } from '@app/transaction-flow/TransactionFlowProvider'
import { setupAnalytics } from '@app/utils/analytics'
import { BreakpointProvider } from '@app/utils/BreakpointProvider'
import { QueryProviders } from '@app/utils/query/providers'
import { SyncDroppedTransaction } from '@app/utils/SyncProvider/SyncDroppedTransaction'
import { SyncProvider } from '@app/utils/SyncProvider/SyncProvider'

import i18n from '../i18n'

import '../styles.css'

const rainbowKitTheme: Theme = {
  ...darkTheme({
    accentColor: thorinLightTheme.colors.accent,
    borderRadius: 'medium',
  }),
  fonts: {
    body: 'Satoshi, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  },
}

const lineaTheme: DefaultTheme = {
  ...thorinLightTheme,
  colors: {
    ...thorinLightTheme.colors,
    grey: '#C0C0C0',
    backgroundPrimary: '#1D1D1D',
    border: '#505050',
    textPrimary: '#ffffff',
    textSecondary: '#000000',
    backgroundSecondary: '#61DFFF',
    background: '#1D1D1D',
    orangeActive: '#F2420C',
    greenActive: '#C1FF14',
    accentPrimary: '#61DFFF',
    greySurface: '#2D2D2D',
    greyPrimary: '#a3a2a2',
    red: '#F2420C',
    accent: '#61DFFF',
    textTertiary: '#C0C0C0',
    yellowSurface: '#e3e39d',
  },
}

const anim = keyframes`
  0% {
    opacity: 1;
  }

  0%, 99% {
    pointer-events: auto;
  }

  100% {
    opacity: 0.5;
    pointer-events: none;
  }
`

const GlobalStyle = createGlobalStyle`
  html,
  body {
    padding: 0;
    margin: 0;
  }

  *,
  ::before,
  ::after {
    font-family: Satoshi,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      sans-serif;
  }

  
  body, .min-safe {
    min-height: 100vh;
    /* stylelint-disable-next-line value-no-vendor-prefix */
    @supports (-webkit-touch-callout: none) {
      /* stylelint-disable-next-line value-no-vendor-prefix */
      min-height: -webkit-fill-available;
    }
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    box-sizing: border-box;
    font-feature-settings: "ss01" on, "ss03" on;
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -moz-font-feature-settings: "ss01" on, "ss03" on;
  }

  .cacheable-component > div:last-of-type > div > * {
    transition: opacity 0.15s ease-in-out;
    opacity: 1;
  }

  .cacheable-component-cached > div:last-of-type > div > * {
    opacity: 0.5;
    pointer-events: none;
    animation: ${anim} 0.25s ease-in-out 0.5s backwards;

    &.transaction-loader {
      opacity: 1;
      pointer-events: auto;
      animation: none;
    }
  }
`

const BackgroundImage = () => {
  return (
    <Image
      src={LineaVector}
      style={{
        objectFit: 'cover',
        zIndex: -1,
        background: '#121212',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
      alt=""
    />
  )
}

const breakpoints = {
  xs: '(min-width: 360px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
}

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

setupAnalytics()

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <I18nextProvider i18n={i18n}>
      <QueryProviders>
        <RainbowKitProvider theme={rainbowKitTheme}>
          <TransactionStoreProvider>
            <ThemeProvider theme={lineaTheme}>
              <BreakpointProvider queries={breakpoints}>
                <BackgroundImage />
                <GlobalStyle />
                <ThorinGlobalStyles />
                <SyncProvider>
                  <TransactionFlowProvider>
                    <SyncDroppedTransaction>
                      <Notifications />
                      <TestnetWarning />
                      <Basic>{getLayout(<Component {...pageProps} />)}</Basic>
                    </SyncDroppedTransaction>
                  </TransactionFlowProvider>
                </SyncProvider>
              </BreakpointProvider>
            </ThemeProvider>
          </TransactionStoreProvider>
        </RainbowKitProvider>
      </QueryProviders>
    </I18nextProvider>
  )
}

export default MyApp
