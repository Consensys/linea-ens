import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'

import { TransactionSection } from '@app/components/pages/profile/settings/TransactionSection/TransactionSection'
import { useSubgraphMeta } from '@app/hooks/ensjs/subgraph/useSubgraphMeta'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { Content } from '@app/layouts/Content'

const OtherWrapper = styled.div(
  ({ theme }) => css`
    grid-area: other;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: ${theme.space['3']};
    flex-gap: ${theme.space['3']};
  `,
)

export default function Page() {
  const { t } = useTranslation('settings')
  const router = useRouter()
  const { address, isConnecting, isReconnecting } = useAccount()

  // We need at least one graph call on this page to ensure that SyncProvider can correctly determine if the
  // graph is erroring or not.
  const subgraphMeta = useSubgraphMeta()

  const isLoading = !router.isReady || isConnecting || isReconnecting || subgraphMeta.isLoading

  useProtectedRoute('/', isLoading ? true : address)

  return (
    <Content singleColumnContent title={t('title')}>
      {{
        trailing: (
          <OtherWrapper>
            <TransactionSection />
          </OtherWrapper>
        ),
      }}
    </Content>
  )
}
