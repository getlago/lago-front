import { MockedProvider } from '@apollo/client/testing'
import { act, renderHook } from '@testing-library/react'

import type { WalletScopeSlice } from '~/components/wallets/tanstackForm/walletFormSchema'

import { useWalletScopeDrawer } from '../useWalletScopeDrawer'

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MockedProvider>{children}</MockedProvider>
)

describe('useWalletScopeDrawer', () => {
  it('exposes an openDrawer function', () => {
    const { result } = renderHook(() => useWalletScopeDrawer(jest.fn()), { wrapper })

    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('openDrawer does not throw with a valid slice', () => {
    const onSave = jest.fn()
    const { result } = renderHook(() => useWalletScopeDrawer(onSave), { wrapper })

    const slice: WalletScopeSlice = { feeTypes: [], billableMetricCodes: [] }

    expect(() => act(() => result.current.openDrawer(slice))).not.toThrow()
  })
})
