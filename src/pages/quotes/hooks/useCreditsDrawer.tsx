import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import type {
  EntityData,
  OnCreditsCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import { CreditsDrawerContent } from '~/components/designSystem/RichTextEditor/CreditsBlock/CreditsDrawerContent'
import type { CreditsBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/CreditsBlock.schema'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { isWalletItemPersistable } from '~/components/wallets/tanstackForm/walletFormSchema'
import { addToast } from '~/core/apolloClient'
import {
  type BillingItemsPayload,
  mergeWalletCredits,
} from '~/core/serializers/serializeQuoteBillingItems'
import {
  fromWallets,
  makeEmptyWalletItem,
  toWallets,
  type WalletFormItem,
} from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import type { SavePricingResult } from '~/pages/quotes/EditQuote'
import { QUOTE_SAVE_FAILED_TOAST_KEY } from '~/pages/quotes/utils/quoteSaveErrorKeys'

const MAX_WALLETS = 5

interface PendingSave {
  onSave: (attrs: CreditsBlockAttributes) => void
  localId: string
  // Whether the drawer opened on an existing block (edit) vs a fresh insertion.
  // A failed edit must NOT roll back (remove) the block — the resubmit path is
  // `updateAttributes`, which can't resurrect a deleted node.
  isEdit: boolean
}

export const useCreditsDrawer = (
  billingItems: BillingItemsPayload | null | undefined,
  options: {
    currency: CurrencyEnum
    onPersist?: (billingItems: BillingItemsPayload) => void | Promise<SavePricingResult>
    onRemoveBlock?: (localId: string) => void
  },
): {
  onCreditsCommand: OnCreditsCommand
  isCreditsDisabled: () => boolean
  entities: Record<string, EntityData>
  syncCreditsBlocks: (
    blocks: CreditsBlockAttributes[],
    options?: { prune?: boolean },
  ) => BillingItemsPayload | undefined
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { currency, onPersist, onRemoveBlock } = options

  const initial = fromWallets(billingItems?.walletCredits ?? [])

  const itemsRef = useRef<Record<string, WalletFormItem>>(
    Object.fromEntries(initial.walletItems.map((w) => [w.localId, w])),
  )
  const [entities, setEntities] = useState<Record<string, EntityData>>(initial.entities)
  // Latest full payload — spread so sibling categories are never dropped.
  const latestBillingItemsRef = useRef<BillingItemsPayload | undefined>(billingItems ?? undefined)

  latestBillingItemsRef.current = billingItems ?? latestBillingItemsRef.current

  // Count of creditsBlock nodes in the doc (for the 5-wallet cap).
  const blockCountRef = useRef<number>(initial.walletItems.length)

  // Working draft for the currently-open wallet + its save target.
  const draftRef = useRef<WalletFormItem>(makeEmptyWalletItem(''))
  const pendingSaveRef = useRef<PendingSave | null>(null)

  // Hydration: the refs above init once, but `billingItems` is undefined on the
  // first render when the quote query is still loading (cold cache). Re-run
  // `fromWallets` when it arrives so saved wallet blocks resolve to preview data
  // and edit opens the persisted wallet (not a blank form). Idempotent post-save:
  // committed `billingItems` reproduces the same items — the working draft lives
  // in `draftRef`, so this never clobbers an in-progress edit. Mirrors the
  // hydration effect in useSubscriptionPricingDrawer.
  useEffect(() => {
    if (!billingItems?.walletCredits) return

    const result = fromWallets(billingItems.walletCredits)

    itemsRef.current = Object.fromEntries(result.walletItems.map((w) => [w.localId, w]))
    blockCountRef.current = result.walletItems.length
    setEntities(result.entities)
  }, [billingItems])

  const rebuild = useCallback((): BillingItemsPayload => {
    const items = Object.values(itemsRef.current)
    const walletCredits = toWallets(items, currency)
    const { entities: nextEntities } = fromWallets(walletCredits)

    setEntities(nextEntities)

    // Sibling-preserving: replaces ONLY walletCredits; plans/addOns/coupons pass through.
    return mergeWalletCredits(latestBillingItemsRef.current, walletCredits)
  }, [currency])

  const handleSave = useCallback(async () => {
    const pending = pendingSaveRef.current

    if (!pending) return

    const draft = draftRef.current

    if (!isWalletItemPersistable(draft)) return // main-drawer save gate

    const { onSave, localId, isEdit } = pending
    const nextItem: WalletFormItem = { ...draft, localId }

    // Build the prospective payload WITHOUT committing itemsRef — the commit
    // only happens once onPersist confirms the save succeeded. Sibling-preserving:
    // replaces ONLY walletCredits; plans/addOns/coupons pass through.
    const prospectiveItems = { ...itemsRef.current, [localId]: nextItem }
    const walletCredits = toWallets(Object.values(prospectiveItems), currency)
    const prospectivePayload = mergeWalletCredits(latestBillingItemsRef.current, walletCredits)

    // Insert the block, then save.
    onSave({ localId })

    const result = (await onPersist?.(prospectivePayload)) ?? { ok: true }

    if (result.ok) {
      itemsRef.current[localId] = nextItem
      rebuild()
      drawer.close()

      return
    }

    // Roll back only a newly inserted block; surface the error and keep the
    // drawer open. Editing an existing block must NOT remove it (see PendingSave).
    if (!isEdit) {
      onRemoveBlock?.(localId)
    }

    addToast({ severity: 'danger', translateKey: QUOTE_SAVE_FAILED_TOAST_KEY })
  }, [drawer, onPersist, onRemoveBlock, rebuild, currency])

  const onCreditsCommand = useCallback<OnCreditsCommand>(
    ({ onSave, editData }) => {
      const localId = editData?.localId ?? crypto.randomUUID()
      const existing = editData ? itemsRef.current[localId] : undefined
      const initialItem = existing ?? makeEmptyWalletItem(localId)

      draftRef.current = initialItem
      pendingSaveRef.current = { onSave, localId, isEdit: !!editData }

      drawer.open({
        title: translate('text_1783352692385rxn8gajgtw4'),
        // handleSave owns close: close on success, stay open (toast + rollback)
        // on a failed save. See FormDrawer.closeOnSubmitSuccess.
        closeOnSubmitSuccess: false,
        form: { id: 'credits-drawer-form', submit: handleSave },
        mainAction: (
          <Button data-test="credits-drawer-submit" type="submit">
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        ),
        children: (
          <CreditsDrawerContent stateRef={draftRef} initialItem={initialItem} currency={currency} />
        ),
      })
    },
    [drawer, translate, handleSave, currency],
  )

  const isCreditsDisabled = useCallback(() => blockCountRef.current >= MAX_WALLETS, [])

  const syncCreditsBlocks = useCallback(
    (
      blocks: CreditsBlockAttributes[],
      syncOptions?: { prune?: boolean },
    ): BillingItemsPayload | undefined => {
      // Always refresh the cap count, even on rollback: otherwise a rolled-back
      // create leaves blockCountRef stale (too high) and wrongly keeps /credits
      // disabled until the next edit.
      blockCountRef.current = blocks.length

      // Rollback skips pruning so the failed wallet's cached payload survives a
      // corrected resubmit (see handleCreditsBlocksChange in EditQuote).
      if (syncOptions?.prune === false) return undefined

      const present = new Set(blocks.map((b) => b.localId).filter(Boolean))
      let changed = false

      for (const key of Object.keys(itemsRef.current)) {
        if (!present.has(key)) {
          delete itemsRef.current[key]
          changed = true
        }
      }

      if (!changed) return undefined

      return rebuild()
    },
    [rebuild],
  )

  return { onCreditsCommand, isCreditsDisabled, entities, syncCreditsBlocks }
}
