import { renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { WalletScopeSlice } from '~/components/wallets/tanstackForm/walletFormSchema'
import { render } from '~/test-utils'

import { useWalletScopeDrawer, WALLET_SCOPE_DRAWER_SAVE_TEST_ID } from '../useWalletScopeDrawer'

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

const validSlice: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

const renderActions = () => {
  const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as { actions: React.ReactNode }

  return render(<>{config.actions}</>)
}

describe('useWalletScopeDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is mounted', () => {
    it('THEN should expose an openDrawer function', () => {
      const { result } = renderHook(() => useWalletScopeDrawer(jest.fn()), { wrapper })

      expect(typeof result.current.openDrawer).toBe('function')
    })

    it('THEN openDrawer should open the drawer', () => {
      const { result } = renderHook(() => useWalletScopeDrawer(jest.fn()), { wrapper })

      result.current.openDrawer(validSlice)

      expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN the drawer is open with a valid slice', () => {
    describe('WHEN clicking save', () => {
      it('THEN should call onSave with the values and close the drawer', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { result } = renderHook(() => useWalletScopeDrawer(onSave), { wrapper })

        result.current.openDrawer(validSlice)
        renderActions()

        await user.click(screen.getByTestId(WALLET_SCOPE_DRAWER_SAVE_TEST_ID))

        await waitFor(() => expect(onSave).toHaveBeenCalledWith(validSlice))
        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN clicking cancel', () => {
      it('THEN should close the drawer without saving', async () => {
        const user = userEvent.setup()
        const onSave = jest.fn()
        const { result } = renderHook(() => useWalletScopeDrawer(onSave), { wrapper })

        result.current.openDrawer(validSlice)
        renderActions()

        await user.click(screen.getByTestId('button'))

        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })
})
