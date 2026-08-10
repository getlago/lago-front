import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import type {
  EntityData,
  OnPricingCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { PricingBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/PricingBlock.schema'
import {
  SubscriptionPricingContent,
  type ValidatePlanForm,
} from '~/components/designSystem/RichTextEditor/PricingBlock/SubscriptionPricingContent'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import type { PlanFormInput } from '~/components/plans/types'
import { addToast } from '~/core/apolloClient'
import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import {
  fromPlanBillingItems,
  type SubscriptionPricingState,
  toPlanBillingItems,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import type { SavePricingResult } from '~/pages/quotes/EditQuote'
import { QUOTE_SAVE_FAILED_TOAST_KEY } from '~/pages/quotes/utils/quoteSaveErrorKeys'

type PlanBillingItem = NonNullable<BillingItemsPayload['plans']>[number]

interface UseSubscriptionPricingDrawerReturn {
  onPricingCommand: OnPricingCommand
  isPricingDisabled: () => boolean
  entities: Record<string, EntityData>
  syncEntitiesWithBlocks: (blocks: PricingBlockAttributes[]) => BillingItemsPayload | null
}

export interface QuoteCustomer {
  id: string
  externalId: string
  name?: string | null
}

export interface SubscriptionPricingDrawerOptions {
  quoteDates?: { startDate?: string; endDate?: string }
  onDatesChange?: (startDate?: string, endDate?: string) => void
  customer?: QuoteCustomer | null
  subscriptionId?: string
  currency?: CurrencyEnum | null
}

export const useSubscriptionPricingDrawer = (
  initialBillingItems?: unknown,
  options?: SubscriptionPricingDrawerOptions,
): UseSubscriptionPricingDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const [entities, setEntities] = useState<Record<string, EntityData>>({})
  const entitiesRef = useRef<Record<string, EntityData>>({})
  const initialStateRef = useRef<SubscriptionPricingState | null>(null)
  const subscriptionStateRef = useRef<SubscriptionPricingState | null>(null)
  const formValuesRef = useRef<PlanFormInput | null>(null)
  const validatePlanFormRef = useRef<ValidatePlanForm | null>(null)

  // Latest saved billingItems, kept in a ref so plan saves/syncs can preserve
  // sibling categories (coupons, addons) instead of overwriting billingItems and
  // dropping them — each drawer only owns its own slice of billingItems.
  const latestBillingItemsRef = useRef<BillingItemsPayload | undefined>(undefined)

  // Session cache of entities/plan-items removed from the doc, so a Cmd+Z that
  // re-inserts the pricing block can re-hydrate them (with the user's overrides)
  // instead of leaving the restored node unresolved. Captured at prune time,
  // before the delete-autosave clears the plan from `latestBillingItemsRef`.
  const removedEntitiesRef = useRef<Record<string, EntityData>>({})
  const removedPlanItemsRef = useRef<Record<string, PlanBillingItem>>({})

  useEffect(() => {
    latestBillingItemsRef.current =
      (initialBillingItems as BillingItemsPayload | undefined) ?? undefined
  }, [initialBillingItems])

  // Determine initialization case: extract billing item plan for case 2
  const billingItemPlan = useMemo(() => {
    if (!initialBillingItems) return undefined
    const parsed = initialBillingItems as BillingItemsPayload

    return parsed.plans?.[0]
  }, [initialBillingItems])
  const onSaveRef = useRef<
    | ((
        attrs: PricingBlockAttributes,
        entityData: Record<string, EntityData>,
        billingItems?: BillingItemsPayload,
      ) => void | Promise<unknown>)
    | null
  >(null)

  // Hydration: populate entities from saved billing items on mount
  useEffect(() => {
    if (!initialBillingItems) return

    const parsed = initialBillingItems as BillingItemsPayload

    if (!parsed.plans?.length) return

    const result = fromPlanBillingItems(parsed.plans)

    initialStateRef.current = {
      planId: result.planId,
      planCode: result.planCode,
      planName: result.planName,
      basePlanName: result.basePlanName,
      planDescription: result.planDescription,
      subscriptionSettings: result.subscriptionSettings,
      invoicingSettings: result.invoicingSettings,
      overrides: result.overrides,
    }

    entitiesRef.current = { ...entitiesRef.current, ...result.entityData }
    setEntities({ ...entitiesRef.current })
  }, [initialBillingItems])

  const onPricingCommand = useCallback<OnPricingCommand>(
    ({ onSave }) => {
      onSaveRef.current = onSave

      const handleSave = async () => {
        const state = subscriptionStateRef.current
        const formValues = formValuesRef.current

        // No submittable plan yet (none selected / form not ready). Surface a
        // toast and keep the drawer open instead of a silent no-op, so the Save
        // click always gives feedback — matching the other pricing drawers.
        if (!state) {
          addToast({ severity: 'danger', translateKey: QUOTE_SAVE_FAILED_TOAST_KEY })

          throw new Error('Incomplete plan')
        }

        // An unfilled billing item must never reach the quote version, otherwise it
        // would be approvable and only fail at execution time. The drawer stays open
        // (`closeOnError: false`) with the invalid fields flagged by the form itself.
        const isPlanFormValid = (await validatePlanFormRef.current?.()) ?? true

        if (!isPlanFormValid) {
          addToast({ severity: 'danger', translateKey: QUOTE_SAVE_FAILED_TOAST_KEY })

          throw new Error('Invalid plan')
        }

        const billingItems = toPlanBillingItems(state, formValues ?? undefined)
        const entityData: Record<string, EntityData> = {
          [state.planId]: {
            entityId: state.planId,
            entityType: 'plan',
            name: state.planName,
            code: state.planCode,
          },
        }

        const result = (await onSaveRef.current?.(
          { pricingType: 'plan', entityIds: [state.planId] },
          entityData,
          {
            ...latestBillingItemsRef.current,
            ...billingItems,
          },
        )) as SavePricingResult | undefined

        if (result?.ok === false) {
          addToast({ severity: 'danger', translateKey: QUOTE_SAVE_FAILED_TOAST_KEY })

          throw new Error('Save failed')
        }

        entitiesRef.current = { ...entitiesRef.current, ...entityData }
        setEntities({ ...entitiesRef.current })

        // Propagate date changes to the quote level
        options?.onDatesChange?.(
          state.subscriptionSettings.startDate || undefined,
          state.subscriptionSettings.endDate || undefined,
        )
      }

      drawer.open({
        title: translate('text_17791987800302plb0guzxzv'),
        closeOnError: false,
        form: {
          id: 'subscription-pricing-drawer-form',
          submit: handleSave,
        },
        mainAction: (
          <Button data-test="subscription-pricing-drawer-submit" type="submit">
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        ),
        children: (
          <SubscriptionPricingContent
            stateRef={subscriptionStateRef}
            formValuesRef={formValuesRef}
            validatePlanFormRef={validatePlanFormRef}
            initialState={initialStateRef.current}
            quoteDates={options?.quoteDates}
            customer={options?.customer}
            currency={options?.currency}
            billingItemPlan={billingItemPlan}
            subscriptionId={billingItemPlan ? undefined : options?.subscriptionId}
          />
        ),
      })
    },
    [translate, drawer, options, billingItemPlan],
  )

  const isPricingDisabled = useCallback(() => Object.keys(entitiesRef.current).length > 0, [])

  const syncEntitiesWithBlocks = useCallback(
    (blocks: PricingBlockAttributes[]): BillingItemsPayload | null => {
      const activeEntityIds = new Set(blocks.flatMap((b) => b.entityIds))
      const currentKeys = Object.keys(entitiesRef.current)

      // Ids that left the doc (deleted) vs. ids that re-appeared in the doc but
      // are no longer active (a Cmd+Z re-inserting a previously-removed block).
      const orphanedKeys = currentKeys.filter((id) => !activeEntityIds.has(id))
      const restoredKeys = [...activeEntityIds].filter(
        (id) => !entitiesRef.current[id] && removedEntitiesRef.current[id],
      )

      if (orphanedKeys.length === 0 && restoredKeys.length === 0) return null

      const updatedEntities = { ...entitiesRef.current }
      // Plan items indexed by id: the current saved slice, plus anything we
      // restore below (whose item lives only in the removed cache once the
      // delete-autosave has cleared it from `latestBillingItemsRef`).
      const planItemsById: Record<string, PlanBillingItem> = {}

      for (const item of latestBillingItemsRef.current?.plans ?? []) {
        planItemsById[item.id] = item
      }

      // Prune: stash the entity + its plan item (with overrides) before removing,
      // so a later undo can rebuild them without re-fetching.
      for (const key of orphanedKeys) {
        removedEntitiesRef.current[key] = updatedEntities[key]

        if (planItemsById[key]) {
          removedPlanItemsRef.current[key] = planItemsById[key]
        }

        delete updatedEntities[key]
      }

      // Restore: pull the entity + plan item back out of the removed cache.
      for (const key of restoredKeys) {
        updatedEntities[key] = removedEntitiesRef.current[key]

        if (removedPlanItemsRef.current[key]) {
          planItemsById[key] = removedPlanItemsRef.current[key]
        }

        delete removedEntitiesRef.current[key]
        delete removedPlanItemsRef.current[key]
      }

      entitiesRef.current = updatedEntities
      setEntities(updatedEntities)

      // Rebuild the plan slice from the active set; sibling categories
      // (coupons, addons) are carried through untouched via the spread.
      const activePlans = Object.keys(updatedEntities)
        .map((id) => planItemsById[id])
        .filter((item): item is PlanBillingItem => Boolean(item))

      return { ...latestBillingItemsRef.current, plans: activePlans }
    },
    [],
  )

  return { onPricingCommand, isPricingDisabled, entities, syncEntitiesWithBlocks }
}
