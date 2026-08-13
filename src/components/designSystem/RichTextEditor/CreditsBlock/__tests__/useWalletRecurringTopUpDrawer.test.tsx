import { fireEvent, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { itemToRecurring } from '~/components/wallets/tanstackForm/walletFormSchema'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useWalletRecurringTopUpDrawer } from '../useWalletRecurringTopUpDrawer'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>

// openDrawer forces enabled:true on reset, so the slice must satisfy the
// enabled-branch of walletRecurringSchema: a Fixed method needs paid/granted
// credits, and a Threshold trigger needs a threshold value.
const validSlice = {
  ...itemToRecurring(makeEmptyWalletItem('wl_1')),
  paidCredits: '5',
  thresholdCredits: '10',
}

const renderActions = () => {
  const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as { actions: React.ReactNode }

  return render(<>{config.actions}</>)
}

// The action-bar save button is gated on `canSubmit`, which TanStack only flips
// after a user interaction — so in tests we submit the drawer's <form> directly
// (children carry `<form onSubmit={handleFormSubmit}>`). handleSubmit still runs
// validation; a valid slice reaches onSubmit regardless of the button's UI state.
const renderFormAndSubmit = () => {
  const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as { children: React.ReactNode }
  const { container } = render(<>{config.children}</>)
  const form = container.querySelector('form') as HTMLFormElement

  fireEvent.submit(form)
}

describe('useWalletRecurringTopUpDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is mounted', () => {
    it('THEN should expose an openDrawer function', () => {
      const { result } = renderHook(
        () => useWalletRecurringTopUpDrawer(jest.fn(), { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      expect(typeof result.current.openDrawer).toBe('function')
    })

    it('THEN openDrawer should open the drawer', () => {
      const { result } = renderHook(
        () => useWalletRecurringTopUpDrawer(jest.fn(), { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      result.current.openDrawer(validSlice)

      expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the drawer is open with a valid slice', () => {
    describe('WHEN submitting the form', () => {
      it('THEN should call onSave with enabled forced true and close the drawer', async () => {
        const onSave = jest.fn()
        const { result } = renderHook(
          () => useWalletRecurringTopUpDrawer(onSave, { currency: CurrencyEnum.Usd }),
          { wrapper },
        )

        result.current.openDrawer(validSlice)
        renderFormAndSubmit()

        await waitFor(() =>
          expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ enabled: true })),
        )
        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN clicking cancel', () => {
      it('THEN should close the drawer without saving', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { result } = renderHook(
          () => useWalletRecurringTopUpDrawer(onSave, { currency: CurrencyEnum.Usd }),
          { wrapper },
        )

        result.current.openDrawer(validSlice)
        renderActions()

        await user.click(screen.getByTestId('button'))

        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })
})
