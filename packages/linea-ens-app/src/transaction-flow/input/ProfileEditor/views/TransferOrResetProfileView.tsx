import { useTranslation } from 'react-i18next'
import { useTheme } from 'styled-components'

import { Button, Dialog } from '@ensdomains/thorin'

import { CenteredTypography } from '../components/CenteredTypography'
import { DetailedSwitch } from '../components/DetailedSwitch'
import { StyledInnerDialog } from '../components/StyledInnerDialog'
import type { SelectedProfile } from '../ResolverWarningOverlay'

type Props = {
  selected: SelectedProfile
  onChangeSelected: (selected: SelectedProfile) => void
  onNext: () => void
  onBack: () => void
}
export const TransferOrResetProfileView = ({
  selected,
  onChangeSelected,
  onNext,
  onBack,
}: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('transactionFlow')

  return (
    <>
      <Dialog.Heading
        title={t('input.profileEditor.warningOverlay.transferOrResetProfile.title')}
      />
      <StyledInnerDialog>
        <CenteredTypography>
          {t('input.profileEditor.warningOverlay.transferOrResetProfile.subtitle')}
        </CenteredTypography>
        <DetailedSwitch
          title={t('input.profileEditor.warningOverlay.transferOrResetProfile.toggle.title')}
          description={t(
            'input.profileEditor.warningOverlay.transferOrResetProfile.toggle.subtitle',
          )}
          checked={selected !== 'reset'}
          onChange={(e) => onChangeSelected(e.currentTarget.checked ? 'latest' : 'reset')}
        />
      </StyledInnerDialog>
      <Dialog.Footer
        leading={
          <Button
            style={{
              backgroundColor: theme.colors.backgroundSecondary,
              color: theme.colors.textSecondary,
            }}
            onClick={onBack}
            data-testid="warning-overlay-back-button"
          >
            {t('action.back', { ns: 'common' })}
          </Button>
        }
        trailing={
          <Button onClick={onNext} data-testid="warning-overlay-next-button">
            {t('action.next', { ns: 'common' })}
          </Button>
        }
      />
    </>
  )
}
