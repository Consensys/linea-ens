import { ComponentProps, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css, useTheme } from 'styled-components'
import { match, P } from 'ts-pattern'
import { useChainId } from 'wagmi'

import { Button, Dialog, Input, mq, Typography } from '@ensdomains/thorin'

import { InnerDialog } from '@app/components/@atoms/InnerDialog'
import { Spacer } from '@app/components/@atoms/Spacer'
import { Outlink } from '@app/components/Outlink'
import { useSubscribeToEarnifi } from '@app/components/pages/profile/[name]/tabs/MoreTab/Miscellaneous/useSubscribeToEarnifi'

export const EARNIFI_OUTLINK =
  'https://www.bankless.com/claimables?utm_source=ENS+Modal&utm_medium=Banner&utm_campaign=ENS_Partnership'

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i

const Form = styled.form(
  ({ theme }) => css`
    width: ${theme.space.full};
    max-width: 100vw;
    ${mq.sm.min(css`
      width: calc(80vw - 2 * ${theme.space['6']});
      max-width: ${theme.space['128']};
    `)}
  `,
)

type Props = {
  name: string
} & Pick<ComponentProps<typeof Dialog>, 'onDismiss' | 'open'>

export const EarnifiDialog = ({ name, open, onDismiss }: Props) => {
  const theme = useTheme()
  const { t } = useTranslation('common')
  const chainId = useChainId()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<{ email: string }>({ mode: 'onChange' })

  const { subscribe, status, reset } = useSubscribeToEarnifi({
    onError: (error) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('tabs.more.misc.bankless.submitError', { ns: 'profile' })
      setError('email', {
        type: 'submitError',
        message,
      })
      setTimeout(() => {
        clearErrors('email')
      }, 3000)
    },
  })

  const handleClick = () => {
    formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  }

  const _onDismiss = () => {
    reset()
    onDismiss?.()
  }

  return (
    <Dialog open={open} variant="blank" onDismiss={() => status !== 'pending' && _onDismiss()}>
      <Dialog.Heading title={t('tabs.more.misc.bankless.title', { ns: 'profile' })} />
      {match(status)
        .with(P.not('success'), () => (
          <Form
            ref={formRef}
            onSubmit={handleSubmit(({ email }) => subscribe({ email, address: name, chainId }))}
          >
            <Typography style={{ textAlign: 'center' }}>
              <Trans
                style={{ textAlign: 'center' }}
                i18nKey="tabs.more.misc.bankless.enterEmail"
                ns="profile"
                components={{
                  a: <Outlink href={EARNIFI_OUTLINK} role="link" />,
                }}
              />
            </Typography>
            <Spacer $height="3" />
            <Input
              type="email"
              id="email"
              label={t('action.enterEmail')}
              {...register('email', {
                required: t('errors.emailRequired'),
                pattern: {
                  value: emailRegex,
                  message: t('errors.emailInvalid'),
                },
              })}
              error={errors.email?.message}
            />
            <Spacer $height="3" />
            <Dialog.Footer
              leading={
                <Button
                  onClick={_onDismiss}
                  style={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {t('action.cancel')}
                </Button>
              }
              trailing={
                <Button
                  disabled={!!errors.email || status === 'pending'}
                  loading={status === 'pending'}
                  onClick={handleClick}
                >
                  {t('action.continue')}
                </Button>
              }
            />
          </Form>
        ))
        .with('success', () => (
          <InnerDialog>
            <div style={{ textAlign: 'center' }}>
              {t('tabs.more.misc.bankless.emailConfirmation', { ns: 'profile' })}
            </div>
            <Dialog.Footer trailing={<Button onClick={_onDismiss}>{t('action.close')}</Button>} />
          </InnerDialog>
        ))
        .exhaustive()}
    </Dialog>
  )
}
