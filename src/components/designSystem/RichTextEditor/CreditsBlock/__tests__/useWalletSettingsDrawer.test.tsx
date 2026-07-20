import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { WalletSettingsSlice } from '~/components/wallets/tanstackForm/walletFormSchema'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  useWalletSettingsDrawer,
  WALLET_SETTINGS_DRAWER_SAVE_TEST_ID,
} from '../useWalletSettingsDrawer'

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

const validSlice: WalletSettingsSlice = {
  name: 'Tokens',
  rateAmount: '1',
  priority: 50,
  expirationAt: null,
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
  purchaseOrderNumber: null,
}

// Render only the drawer's action bar (cancel + save) captured from drawer.open.
const renderActions = () => {
  const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as { actions: React.ReactNode }

  return render(<>{config.actions}</>)
}

describe('useWalletSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is mounted', () => {
    it('THEN should expose an openDrawer function', () => {
      const { result } = renderHook(() => useWalletSettingsDrawer(jest.fn(), CurrencyEnum.Usd), {
        wrapper,
      })

      expect(typeof result.current.openDrawer).toBe('function')
    })

    it('THEN openDrawer should open the drawer', () => {
      const { result } = renderHook(() => useWalletSettingsDrawer(jest.fn(), CurrencyEnum.Usd), {
        wrapper,
      })

      result.current.openDrawer(validSlice)

      expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the drawer is open with a valid slice', () => {
    describe('WHEN clicking save', () => {
      it('THEN should call onSave with the values and close the drawer', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { result } = renderHook(() => useWalletSettingsDrawer(onSave, CurrencyEnum.Usd), {
          wrapper,
        })

        result.current.openDrawer(validSlice)
        renderActions()

        await user.click(screen.getByTestId(WALLET_SETTINGS_DRAWER_SAVE_TEST_ID))

        await waitFor(() => expect(onSave).toHaveBeenCalledWith(validSlice))
        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN clicking cancel', () => {
      it('THEN should close the drawer without saving', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { result } = renderHook(() => useWalletSettingsDrawer(onSave, CurrencyEnum.Usd), {
          wrapper,
        })

        result.current.openDrawer(validSlice)
        renderActions()

        await user.click(screen.getByTestId('button'))

        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })
})
