import { act, renderHook } from '@testing-library/react'

import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import { makeEmptyWalletItem, toWallets } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'

import { useCreditsDrawer } from '../useCreditsDrawer'

// CreditsDrawerContent (rendered only inside drawer.open, not exercised by these
// tests) transitively pulls in useDrawer -> drawerStack.ts, which uses Vite-only
// `import.meta.hot` that Jest cannot parse. Mock useFormDrawer here, as the
// sibling useSubscriptionPricingDrawer test does, to avoid loading that module.
const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>

// Pull the submit callback the hook handed to drawer.open on the last open() call.
const lastDrawerSubmit = (): (() => Promise<void>) => {
  const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as {
    form: { submit: () => Promise<void> }
  }

  return config.form.submit
}

const persistableWallet = (localId: string) => ({
  ...makeEmptyWalletItem(localId),
  rateAmount: '1',
  paidCredits: '10',
})

const withOneWallet: BillingItemsPayload = {
  plans: [{ type: 'plan' } as never],
  addOns: [{ type: 'add_on' } as never],
  coupons: [{ type: 'coupon' } as never],
  walletCredits: toWallets([persistableWallet('wl_1')], CurrencyEnum.Usd),
}

describe('useCreditsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a saved credits block', () => {
    it('THEN should hydrate entities from billingItems.walletCredits', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      expect(result.current.entities.wl_1).toMatchObject({ entityType: 'wallet' })
    })
  })

  describe('GIVEN the 5-wallet cap', () => {
    it('THEN isCreditsDisabled returns true once 5 blocks are present', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(undefined, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      act(() => {
        result.current.syncCreditsBlocks(
          Array.from({ length: 5 }, (_, i) => ({ localId: `wl_${i}` })),
        )
      })

      expect(result.current.isCreditsDisabled()).toBe(true)
    })

    it('THEN isCreditsDisabled returns false below the cap', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(undefined, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      expect(result.current.isCreditsDisabled()).toBe(false)
    })
  })

  describe('GIVEN syncCreditsBlocks', () => {
    it('THEN prunes deleted wallets and preserves ALL sibling categories', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      let updated: BillingItemsPayload | undefined

      act(() => {
        updated = result.current.syncCreditsBlocks([]) // wl_1 removed from the doc
      })

      expect(updated?.walletCredits).toEqual([])
      // Deleting a wallet must NOT drop plans/addOns/coupons (billingItems-category-drop regression).
      expect(updated?.plans).toEqual(withOneWallet.plans)
      expect(updated?.addOns).toEqual(withOneWallet.addOns)
      expect(updated?.coupons).toEqual(withOneWallet.coupons)
    })

    it('THEN returns undefined when no block was pruned', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      let updated: BillingItemsPayload | undefined = withOneWallet

      act(() => {
        updated = result.current.syncCreditsBlocks([{ localId: 'wl_1' }]) // still present
      })

      expect(updated).toBeUndefined()
    })

    it('THEN refreshes the cap but skips pruning when prune is disabled (rollback path)', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      // A fresh insert during a failed create pushed the doc to the 5-wallet cap.
      act(() => {
        result.current.syncCreditsBlocks(
          Array.from({ length: 5 }, (_, i) => ({ localId: `wl_${i}` })),
        )
      })

      expect(result.current.isCreditsDisabled()).toBe(true)

      let updated: BillingItemsPayload | undefined = withOneWallet

      // Rollback removes the failed block: recount so the cap frees up, but skip
      // pruning so wl_1's cached payload survives a corrected resubmit. Returning
      // undefined keeps the rollback from firing a corrective save.
      act(() => {
        updated = result.current.syncCreditsBlocks(
          Array.from({ length: 4 }, (_, i) => ({ localId: `wl_${i}` })),
          { prune: false },
        )
      })

      expect(result.current.isCreditsDisabled()).toBe(false)
      expect(updated).toBeUndefined()
    })
  })

  describe('GIVEN onCreditsCommand opens the drawer', () => {
    it('THEN should open a submit form drawer', () => {
      const { result } = renderHook(
        () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
        { wrapper },
      )

      act(() => {
        result.current.onCreditsCommand({ onSave: jest.fn(), editData: { localId: 'wl_1' } })
      })

      const config = mockDrawerOpen.mock.calls.at(-1)?.[0] as {
        closeOnSubmitSuccess: boolean
        form: { id: string; submit: unknown }
      }

      expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
      expect(config.closeOnSubmitSuccess).toBe(false)
      expect(config.form.id).toBe('credits-drawer-form')
    })
  })

  describe('GIVEN a save is submitted from the drawer', () => {
    describe('WHEN editing an existing (persistable) wallet and onPersist succeeds', () => {
      it('THEN should insert the block, persist a sibling-preserving payload and close', async () => {
        const onSave = jest.fn()
        const onPersist = jest.fn().mockResolvedValue({ ok: true })
        const { result } = renderHook(
          () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd, onPersist }),
          { wrapper },
        )

        act(() => {
          result.current.onCreditsCommand({ onSave, editData: { localId: 'wl_1' } })
        })

        await act(async () => {
          await lastDrawerSubmit()()
        })

        expect(onSave).toHaveBeenCalledWith({ localId: 'wl_1' })
        expect(onPersist).toHaveBeenCalledTimes(1)

        const payload = onPersist.mock.calls[0][0] as BillingItemsPayload

        expect(payload.walletCredits).toHaveLength(1)
        expect(payload.plans).toEqual(withOneWallet.plans)
        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN there is no onPersist handler', () => {
      it('THEN should treat the save as successful and close', async () => {
        const onSave = jest.fn()
        const { result } = renderHook(
          () => useCreditsDrawer(withOneWallet, { currency: CurrencyEnum.Usd }),
          { wrapper },
        )

        act(() => {
          result.current.onCreditsCommand({ onSave, editData: { localId: 'wl_1' } })
        })

        await act(async () => {
          await lastDrawerSubmit()()
        })

        expect(onSave).toHaveBeenCalledWith({ localId: 'wl_1' })
        expect(mockDrawerClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN editing an existing wallet and onPersist fails', () => {
      it('THEN should keep the block (no rollback), toast an error and keep the drawer open', async () => {
        const onSave = jest.fn()
        const onRemoveBlock = jest.fn()
        const onPersist = jest.fn().mockResolvedValue({ ok: false })
        const { result } = renderHook(
          () =>
            useCreditsDrawer(withOneWallet, {
              currency: CurrencyEnum.Usd,
              onPersist,
              onRemoveBlock,
            }),
          { wrapper },
        )

        act(() => {
          result.current.onCreditsCommand({ onSave, editData: { localId: 'wl_1' } })
        })

        await act(async () => {
          await lastDrawerSubmit()()
        })

        // isEdit === true → the existing block must NOT be removed.
        expect(onRemoveBlock).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        expect(mockDrawerClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the draft is not persistable', () => {
      it('THEN should no-op without persisting', async () => {
        const onSave = jest.fn()
        const onPersist = jest.fn().mockResolvedValue({ ok: true })
        const { result } = renderHook(
          () => useCreditsDrawer(undefined, { currency: CurrencyEnum.Usd, onPersist }),
          { wrapper },
        )

        // No editData → a fresh empty wallet, which fails the persistable gate.
        act(() => {
          result.current.onCreditsCommand({ onSave })
        })

        await act(async () => {
          await lastDrawerSubmit()()
        })

        expect(onPersist).not.toHaveBeenCalled()
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })
})
