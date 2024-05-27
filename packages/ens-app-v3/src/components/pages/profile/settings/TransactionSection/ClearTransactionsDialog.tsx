import { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'

import { InnerDialog } from '@app/components/@atoms/InnerDialog'
import { Dialog } from '@app/components/@organisms/Dialog/Dialog'
import { Button } from '@app/components/styled/Button'

const StyledInnerDialog = styled(InnerDialog)(
  () => css`
    text-align: center;
  `,
)

type Props = { onClear: () => void } & Omit<ComponentProps<typeof Dialog>, 'children' | 'variant'>

export const ClearTransactionsDialog = ({ open, onDismiss, onClose, onClear }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('settings')
  return (
    <Dialog open={open} variant="blank" onDismiss={onDismiss} onClose={onClose}>
      <Dialog.Heading alert="warning" title={t('section.transaction.clearTransactions.title')} />
      <StyledInnerDialog>
        {t('section.transaction.clearTransactions.description')}
      </StyledInnerDialog>
      <Dialog.Footer
        leading={
          <Button
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.textSecondary,
            }}
            onClick={onDismiss}
          >
            {t('action.cancel', { ns: 'common' })}
          </Button>
        }
        trailing={
          <Button onClick={onClear} data-testid="clear-transactions-dialog-clear-button">
            {t('section.transaction.clearTransactions.actionLabel')}
          </Button>
        }
      />
    </Dialog>
  )
}
