import { act, renderHook } from '@testing-library/react'

import type { WalletSettingsSlice } from '~/components/wallets/tanstackForm/walletFormSchema'
import { CurrencyEnum } from '~/generated/graphql'

import { useWalletSettingsDrawer } from '../useWalletSettingsDrawer'

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

describe('useWalletSettingsDrawer', () => {
  it('exposes an openDrawer function', () => {
    const { result } = renderHook(() => useWalletSettingsDrawer(jest.fn(), CurrencyEnum.Usd), {
      wrapper,
    })

    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('openDrawer does not throw with a valid slice', () => {
    const onSave = jest.fn()
    const { result } = renderHook(() => useWalletSettingsDrawer(onSave, CurrencyEnum.Usd), {
      wrapper,
    })

    const slice: WalletSettingsSlice = {
      name: 'Tokens',
      rateAmount: '1',
      priority: 50,
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    }

    expect(() => act(() => result.current.openDrawer(slice))).not.toThrow()
  })
})
