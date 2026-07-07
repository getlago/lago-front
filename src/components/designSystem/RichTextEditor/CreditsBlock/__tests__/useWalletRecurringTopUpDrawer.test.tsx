import { act, renderHook } from '@testing-library/react'

import { itemToRecurring } from '~/components/wallets/tanstackForm/walletFormSchema'
import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'

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

describe('useWalletRecurringTopUpDrawer', () => {
  it('exposes openDrawer and does not throw', () => {
    const { result } = renderHook(
      () => useWalletRecurringTopUpDrawer(jest.fn(), { currency: CurrencyEnum.Usd }),
      { wrapper },
    )

    const slice = itemToRecurring(makeEmptyWalletItem('wl_1'))

    expect(() => act(() => result.current.openDrawer(slice))).not.toThrow()
  })
})
