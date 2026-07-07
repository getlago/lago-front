import { act, renderHook } from '@testing-library/react'

import type { WalletFreeAndPaidSlice } from '~/components/wallets/tanstackForm/walletFormSchema'
import { CurrencyEnum } from '~/generated/graphql'

import { useWalletFreeAndPaidCreditsDrawer } from '../useWalletFreeAndPaidCreditsDrawer'

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

const ctx = {
  currency: CurrencyEnum.Usd,
  rateAmount: '1',
  walletName: 'Tokens',
  min: null,
  max: null,
}

describe('useWalletFreeAndPaidCreditsDrawer', () => {
  it('exposes an openDrawer function', () => {
    const { result } = renderHook(() => useWalletFreeAndPaidCreditsDrawer(jest.fn(), ctx), {
      wrapper,
    })

    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('openDrawer does not throw with a valid slice', () => {
    const onSave = jest.fn()
    const { result } = renderHook(() => useWalletFreeAndPaidCreditsDrawer(onSave, ctx), {
      wrapper,
    })

    const slice: WalletFreeAndPaidSlice = {
      freeCredits: '',
      paidCredits: '',
      invoiceRequiresSuccessfulPayment: false,
      metadata: [],
    }

    expect(() => act(() => result.current.openDrawer(slice))).not.toThrow()
  })
})
