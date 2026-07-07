import { useCallback, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import type {
  EntityData,
  OnCreditsCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import { CreditsDrawerContent } from '~/components/designSystem/RichTextEditor/CreditsBlock/CreditsDrawerContent'
import type { CreditsBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/CreditsBlock.schema'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { isWalletItemPersistable } from '~/components/wallets/tanstackForm/walletFormSchema'
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

const MAX_WALLETS = 5

interface PendingSave {
  onSave: (attrs: CreditsBlockAttributes) => void
  localId: string
}

export const useCreditsDrawer = (
  billingItems: BillingItemsPayload | null | undefined,
  options: { currency: CurrencyEnum; onPersist?: (billingItems: BillingItemsPayload) => void },
): {
  onCreditsCommand: OnCreditsCommand
  isCreditsDisabled: () => boolean
  entities: Record<string, EntityData>
  syncCreditsBlocks: (blocks: CreditsBlockAttributes[]) => BillingItemsPayload | undefined
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { currency, onPersist } = options

  const initial = fromWallets(billingItems?.wallet_credits ?? [])

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

  const rebuild = useCallback((): BillingItemsPayload => {
    const items = Object.values(itemsRef.current)
    const wallet_credits = toWallets(items, currency)
    const { entities: nextEntities } = fromWallets(wallet_credits)

    setEntities(nextEntities)

    // Sibling-preserving: replaces ONLY wallet_credits; plans/addons/coupons pass through.
    return mergeWalletCredits(latestBillingItemsRef.current, wallet_credits)
  }, [currency])

  const handleSave = useCallback(() => {
    const pending = pendingSaveRef.current

    if (!pending) return

    const draft = draftRef.current

    if (!isWalletItemPersistable(draft)) return // main-drawer save gate

    itemsRef.current[pending.localId] = { ...draft, localId: pending.localId }

    const updated = rebuild()

    pending.onSave({ localId: pending.localId })
    onPersist?.(updated)
    drawer.close()
  }, [drawer, onPersist, rebuild])

  const onCreditsCommand = useCallback<OnCreditsCommand>(
    ({ onSave, editData }) => {
      const localId = editData?.localId ?? crypto.randomUUID()
      const existing = editData ? itemsRef.current[localId] : undefined
      const initialItem = existing ?? makeEmptyWalletItem(localId)

      draftRef.current = initialItem
      pendingSaveRef.current = { onSave, localId }

      drawer.open({
        title: translate('text_1783352692385rxn8gajgtw4'),
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
    (blocks: CreditsBlockAttributes[]): BillingItemsPayload | undefined => {
      blockCountRef.current = blocks.length

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
