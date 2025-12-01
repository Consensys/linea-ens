import { render, screen, userEvent, waitFor } from '@app/test-utils'

import { describe, expect, it, vi } from 'vitest'

import { GRACE_PERIOD } from '@app/utils/constants'

import { ExpirySection } from './ExpirySection'

vi.mock('./hooks/useExpiryDetails', () => ({
  useExpiryDetails: ({ name }: any) => {
    if (name === 'test.eth')
      return {
        data: [
          { type: 'expiry', date: new Date(3255803954000) },
          { type: 'grace-period', date: new Date(3255803954000 + GRACE_PERIOD) },
          { type: 'registration', date: new Date(3255803954000) },
        ],
        isLoading: false,
      }
  },
}))

const mockShowInput = vi.fn()
vi.mock('./hooks/useExpiryActions', () => ({
  useExpiryActions: ({ name }: any) => {
    if (name === 'test.eth')
      return [
        {
          label: 'action.extend',
          type: 'extend',
          icon: <div>ICON</div>,
          primary: true,
          onClick: () => {
            mockShowInput()
          },
        },
      ]
  },
}))

describe('ExpirySection', () => {
  it('should be able to call show extend modal', async () => {
    render(<ExpirySection name="test.eth" details={{} as any} />)
    expect(screen.getByText('action.extend')).toBeVisible()
    await userEvent.click(screen.getByText('action.extend'))
    await waitFor(() => {
      expect(mockShowInput).toHaveBeenCalled()
    })
  })
})
