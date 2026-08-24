import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import type {
  EntityData,
  OnPricingCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { PricingBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/PricingBlock.schema'
import {
  type AddOnItem,
  pricingDrawerDefaultValues,
} from '~/components/designSystem/RichTextEditor/PricingBlock/constants'
import PricingDrawerContent from '~/components/designSystem/RichTextEditor/PricingBlock/PricingDrawerContent'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { addToast } from '~/core/apolloClient'
import {
  type AddOnPayload,
  type BillingItemsPayload,
  fromBillingItems,
  toBillingItems,
} from '~/core/serializers/serializeQuoteBillingItems'
import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { type AddOnForPricingSectionFragment, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import type { SavePricingResult } from '~/pages/quotes/EditQuote'
import {
  ADDONS_ERROR_CONFIG,
  mapBillingItemErrors,
} from '~/pages/quotes/utils/mapBillingItemErrors'
import {
  QUOTE_FIELD_ERROR_KEY,
  QUOTE_SAVE_FAILED_TOAST_KEY,
} from '~/pages/quotes/utils/quoteSaveErrorKeys'
import {
  clearServerFieldErrors,
  setServerFieldErrors,
} from '~/pages/quotes/utils/serverFieldErrors'

// --- Hook ---

const PRICING_DRAWER_FORM_ID = 'pricing-drawer-form'

export interface UseOneOffPricingDrawerReturn {
  onPricingCommand: OnPricingCommand
  isPricingDisabled: () => boolean
  entities: Record<string, EntityData>
  syncEntitiesWithBlocks: (blocks: PricingBlockAttributes[]) => BillingItemsPayload | null
}

// One entry of the removed-add-on session cache (see removedAddOnsRef). Holds
// both the localId-keyed entity/payload and their backward-compat alias copies.
type RemovedAddOn = {
  addOnId: string
  entity: EntityData
  aliasEntity?: EntityData
  payload?: AddOnPayload
  aliasPayload?: AddOnPayload
}

// Prune deleted add-ons from local state, stashing each (entity + payload +
// alias) in the removed cache so a later undo can rebuild them. Mutates the
// passed-in maps in place.
const stashRemovedAddOns = (
  removedLocalIds: string[],
  catalogIdMap: Record<string, string>,
  entities: Record<string, EntityData>,
  payloads: Record<string, AddOnPayload>,
  removedCache: Record<string, RemovedAddOn>,
): void => {
  for (const localId of removedLocalIds) {
    const addOnId = catalogIdMap[localId]

    removedCache[localId] = {
      addOnId,
      entity: entities[localId],
      aliasEntity: entities[addOnId],
      payload: payloads[localId],
      aliasPayload: payloads[addOnId],
    }

    delete entities[localId]
    delete entities[addOnId]
    delete payloads[localId]
    delete payloads[addOnId]
    delete catalogIdMap[localId]
  }
}

// Restore add-ons whose block re-appeared (undo): re-key the entity, payload and
// alias from the removed cache. Overrides survive because both the entity (edited
// values) and payload (baseline) come from the cache, not the catalog.
const restoreAddOns = (
  restoredLocalIds: string[],
  catalogIdMap: Record<string, string>,
  entities: Record<string, EntityData>,
  payloads: Record<string, AddOnPayload>,
  removedCache: Record<string, RemovedAddOn>,
): void => {
  for (const localId of restoredLocalIds) {
    const { addOnId, entity, aliasEntity, payload, aliasPayload } = removedCache[localId]

    catalogIdMap[localId] = addOnId
    entities[localId] = entity

    if (aliasEntity) entities[addOnId] = aliasEntity
    if (payload) payloads[localId] = payload
    if (aliasPayload) payloads[addOnId] = aliasPayload

    delete removedCache[localId]
  }
}

// Re-key a catalog-id map in document (block) order so downstream position
// assignment (index + 1 in toBillingItems) follows the doc, not insertion order.
// A restored add-on would otherwise land at the end of the map.
const orderCatalogIdMapByBlocks = (
  catalogIdMap: Record<string, string>,
  blocks: PricingBlockAttributes[],
): Record<string, string> => {
  const ordered: Record<string, string> = {}

  // A block references an add-on by its localId or its catalog alias.
  const resolveLocalId = (refId: string): string | undefined =>
    catalogIdMap[refId]
      ? refId
      : Object.keys(catalogIdMap).find((key) => catalogIdMap[key] === refId)

  for (const block of blocks) {
    const refIds = block.localEntityIds?.length ? block.localEntityIds : block.entityIds

    for (const refId of refIds ?? []) {
      const localId = resolveLocalId(refId)

      if (localId && catalogIdMap[localId] && !ordered[localId]) {
        ordered[localId] = catalogIdMap[localId]
      }
    }
  }

  // Safety net: keep any residual keys (there should be none post-prune) so a
  // survivor is never silently dropped from the rebuild.
  for (const localId of Object.keys(catalogIdMap)) {
    if (!ordered[localId]) {
      ordered[localId] = catalogIdMap[localId]
    }
  }

  return ordered
}

// Rebuild the surviving add-on items from the (ordered) catalog map, carrying
// each entity's user overrides so toBillingItems doesn't reset them to catalog
// defaults. Items whose entity is gone are dropped.
const buildSurvivingAddOnItems = (
  catalogIdMap: Record<string, string>,
  entities: Record<string, EntityData>,
): AddOnItem[] =>
  Object.keys(catalogIdMap)
    .map((localId): AddOnItem | null => {
      const entity = entities[localId]

      if (!entity) return null

      return {
        localId,
        addOnId: catalogIdMap[localId],
        name: entity.name,
        invoiceDisplayName: entity.invoiceDisplayName ?? '',
        code: entity.code,
        description: entity.description ?? '',
        units: entity.units ?? '',
        unitAmountCents: entity.unitAmountCents ?? '',
        totalAmount: entity.totalAmount ?? '',
        fromDatetime: entity.fromDatetime ?? '',
        toDatetime: entity.toDatetime ?? '',
      }
    })
    .filter((item): item is AddOnItem => item !== null)

export interface OneOffPricingDrawerOptions {
  /** Currency used to display amounts — may be a customer/organization fallback. */
  currency?: CurrencyEnum | null
  /** Whether `currency` is the quote's own currency rather than a fallback. */
  hasQuoteCurrency?: boolean
  paymentTerm?: ResolvablePaymentTerm | null
}

export const useOneOffPricingDrawer = (
  initialBillingItems?: unknown,
  options?: OneOffPricingDrawerOptions,
): UseOneOffPricingDrawerReturn => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const formDrawer = useFormDrawer()

  // The quote currency drives amount cents (de)serialization. Kept in a ref so
  // the stable callbacks (form onSubmit, syncEntitiesWithBlocks) always read the
  // latest value without depending on it.
  const currency = options?.currency ?? organization?.defaultCurrency ?? CurrencyEnum.Usd
  const hasQuoteCurrency = !!options?.hasQuoteCurrency
  const hasQuoteCurrencyRef = useRef(hasQuoteCurrency)

  hasQuoteCurrencyRef.current = hasQuoteCurrency
  const currencyRef = useRef(currency)

  currencyRef.current = currency
  const entitiesRef = useRef<Record<string, EntityData>>({})
  const [entities, setEntities] = useState<Record<string, EntityData>>({})
  const payloadsRef = useRef<Record<string, AddOnPayload>>({})
  const catalogIdMapRef = useRef<Record<string, string>>({})
  // Catalog currency of each selected add-on, used to seed the quote currency
  // when the quote has none of its own yet.
  const addOnCurrencyMapRef = useRef<Record<string, CurrencyEnum>>({})

  // Session cache of add-ons removed from the doc, keyed by localId, so a Cmd+Z
  // that re-inserts the pricing block can re-hydrate the entity, its catalog
  // payload and alias — preserving the user's overrides (rebuilt from the cached
  // entity/payload, never re-fetched from the catalog). Captured at prune time,
  // before the delete-autosave clears the add-on from the persisted billingItems.
  const removedAddOnsRef = useRef<Record<string, RemovedAddOn>>({})
  const onSaveRef = useRef<
    | ((
        attrs: PricingBlockAttributes,
        entityData: Record<string, EntityData>,
        billingItems?: BillingItemsPayload,
        currency?: CurrencyEnum,
      ) => void | Promise<unknown>)
    | null
  >(null)
  const lastSaveResultRef = useRef<SavePricingResult | null>(null)

  // Hydrate from saved billingItems on mount / when quote data arrives
  useEffect(() => {
    if (!initialBillingItems) return

    const parsed = initialBillingItems as BillingItemsPayload

    if (!parsed.addOns?.length) return

    const {
      entities: formattedEntities,
      originalPayloads,
      addOnItems,
    } = fromBillingItems(parsed, currency)

    // Populate catalogIdMap and add backward-compat entries keyed by catalog addOnId
    // so old TipTap entityIds (catalog IDs) can still resolve
    const backwardCompatEntities: Record<string, EntityData> = {}
    const backwardCompatPayloads: Record<string, AddOnPayload> = {}

    for (const item of addOnItems) {
      catalogIdMapRef.current[item.localId] = item.addOnId
      backwardCompatEntities[item.addOnId] = formattedEntities[item.localId]

      if (originalPayloads[item.localId]) {
        backwardCompatPayloads[item.addOnId] = originalPayloads[item.localId]
      }
    }

    const updated = { ...entitiesRef.current, ...formattedEntities, ...backwardCompatEntities }

    entitiesRef.current = updated
    setEntities(updated)
    payloadsRef.current = { ...payloadsRef.current, ...originalPayloads, ...backwardCompatPayloads }
  }, [initialBillingItems, currency])

  const captureAddOnPayload = useCallback(
    (localId: string, addOn: AddOnForPricingSectionFragment) => {
      catalogIdMapRef.current[localId] = addOn.id
      addOnCurrencyMapRef.current[localId] = addOn.amountCurrency
      payloadsRef.current[localId] = {
        position: 0, // will be set correctly by toBillingItems
        code: addOn.code,
        name: addOn.name,
        description: addOn.description ?? '',
        units: 1,
        unitAmountCents: Number(addOn.amountCents),
        totalAmountCents: Number(addOn.amountCents), // units=1 × amountCents
        invoiceDisplayName: addOn.invoiceDisplayName ?? '',
        fromDatetime: null,
        toDatetime: null,
        taxCodes: addOn.taxes?.map((t) => t.code) ?? [],
      }
    },
    [],
  )

  const validationSchema = useMemo(
    () =>
      z
        .object({
          planId: z.string(),
          addOnItems: z.array(
            z.object({
              localId: z.string(),
              addOnId: z.string(),
              name: z.string(),
              invoiceDisplayName: z.string(),
              code: z.string(),
              description: z.string(),
              units: z.string(),
              unitAmountCents: z.string(),
              totalAmount: z.string(),
              fromDatetime: z.string(),
              toDatetime: z.string(),
            }),
          ),
        })
        .superRefine((data, ctx) => {
          // At least one confirmed add-on
          const confirmed = data.addOnItems.filter((item) => item.addOnId)

          if (confirmed.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: translate('text_1779958764076n5tclla792h'),
              path: ['addOnItems'],
            })
            return
          }

          // Each confirmed add-on needs units and unit price
          data.addOnItems.forEach((item, index) => {
            if (!item.addOnId) return

            if (!item.units || item.units === '0') {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: translate('text_1779958764076e77b9cs2q5q'),
                path: ['addOnItems', index, 'units'],
              })
            }

            if (!item.unitAmountCents) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: translate('text_1779958764076kncdf7nqbts'),
                path: ['addOnItems', index, 'unitAmountCents'],
              })
            }
          })
        }),
    [translate],
  )

  const form = useAppForm({
    defaultValues: pricingDrawerDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    listeners: {
      // Server (422) field errors sit in the `onDynamic` errorMap slot, which
      // keeps `canSubmit` false and would otherwise deadlock the drawer:
      // `form.handleSubmit()` won't re-run `onSubmit` (where errors are cleared)
      // while the stale error stands. Clearing on edit lets `canSubmit` recover
      // so the user can resubmit once they've fixed the field.
      onChange: ({ formApi }) => {
        const paths = (formApi.state.values.addOnItems ?? []).flatMap((_item, index) => [
          `addOnItems[${index}].units`,
          `addOnItems[${index}].unitAmountCents`,
        ])

        clearServerFieldErrors(formApi, paths, QUOTE_FIELD_ERROR_KEY)
      },
    },
    onSubmit: async ({ value }) => {
      const confirmedItems = value.addOnItems.filter((item) => item.addOnId)

      if (confirmedItems.length === 0) return

      const fieldPaths = confirmedItems.map(
        (_item, index) => `addOnItems[${index}].unitAmountCents`,
      )
      const unitPaths = confirmedItems.map((_item, index) => `addOnItems[${index}].units`)

      clearServerFieldErrors(form, [...fieldPaths, ...unitPaths], QUOTE_FIELD_ERROR_KEY)

      const entityData: Record<string, EntityData> = {}

      confirmedItems.forEach((item) => {
        entityData[item.localId] = {
          entityId: item.localId,
          entityType: 'addOn',
          name: item.name,
          invoiceDisplayName: item.invoiceDisplayName,
          code: item.code,
          description: item.description,
          units: item.units,
          unitAmountCents: item.unitAmountCents,
          totalAmount: item.totalAmount,
          fromDatetime: item.fromDatetime,
          toDatetime: item.toDatetime,
        }
      })

      const billingItems = toBillingItems(confirmedItems, payloadsRef.current, currencyRef.current)

      const attrs: PricingBlockAttributes = {
        pricingType: 'addOns' as const,
        entityIds: confirmedItems.map((item) => item.addOnId),
        localEntityIds: confirmedItems.map((item) => item.localId),
      }

      // The quote has no currency of its own yet: the first add-on defines it.
      const seededCurrency = hasQuoteCurrencyRef.current
        ? undefined
        : addOnCurrencyMapRef.current[confirmedItems[0]?.localId]

      const result = (await onSaveRef.current?.(
        attrs,
        entityData,
        billingItems,
        seededCurrency,
      )) as SavePricingResult | undefined

      lastSaveResultRef.current = result ?? { ok: true }

      if (result?.ok !== false) {
        const updatedAddOns = { ...entitiesRef.current, ...entityData }

        entitiesRef.current = updatedAddOns
        setEntities(updatedAddOns)

        return
      }

      const { fieldErrors, unmapped } = mapBillingItemErrors(result.error, ADDONS_ERROR_CONFIG)

      setServerFieldErrors(form, fieldErrors, QUOTE_FIELD_ERROR_KEY)

      if (unmapped.length > 0 || fieldErrors.length === 0) {
        addToast({ severity: 'danger', translateKey: QUOTE_SAVE_FAILED_TOAST_KEY })
      }
    },
  })

  const onPricingCommand: OnPricingCommand = useCallback(
    ({ onSave, editData }) => {
      // Only allow one pricing block (new insertion only, not edits)
      if (!editData && Object.keys(entitiesRef.current).length > 0) {
        return
      }

      onSaveRef.current = onSave

      const initialAddOnItems =
        editData?.pricingType === 'addOns'
          ? editData.entityIds.map((catalogId, i) => {
              const localId = editData.localEntityIds?.[i]
              const lookupId = localId ?? catalogId
              const existing = entitiesRef.current[lookupId]

              const today = DateTime.now()

              return {
                localId: localId ?? crypto.randomUUID(),
                addOnId: catalogIdMapRef.current[lookupId] ?? catalogId,
                name: existing?.name ?? catalogId,
                invoiceDisplayName: existing?.invoiceDisplayName ?? '',
                code: existing?.code ?? '',
                description: existing?.description ?? '',
                units: existing?.units ?? '1',
                unitAmountCents: existing?.unitAmountCents ?? '0',
                totalAmount: existing?.totalAmount ?? '',
                fromDatetime: existing?.fromDatetime ?? today.startOf('day').toISO(),
                toDatetime: existing?.toDatetime ?? today.endOf('day').toISO(),
              }
            })
          : []

      form.reset(
        {
          planId: '',
          addOnItems: initialAddOnItems,
        },
        { keepDefaultValues: true },
      )

      const handleSubmit = async () => {
        lastSaveResultRef.current = null

        await form.handleSubmit()

        if (!form.state.canSubmit) {
          throw new Error('Validation failed')
        }

        // `lastSaveResultRef.current` is mutated by the form's `onSubmit` closure,
        // invoked indirectly through `form.handleSubmit()` above. TS's control-flow
        // analysis cannot see through that indirection and otherwise narrows the
        // property to the literal `null` assigned a few lines up — the cast below
        // forces a fresh read of the ref's declared type.
        const lastSaveResult = lastSaveResultRef.current as SavePricingResult | null

        if (lastSaveResult && !lastSaveResult.ok) {
          throw new Error('Save failed')
        }
      }

      formDrawer.open({
        title: translate('text_17799586575620rdqef1d7dq'),
        form: {
          id: PRICING_DRAWER_FORM_ID,
          submit: handleSubmit,
        },
        mainAction: (
          <form.AppForm>
            <form.SubmitButton dataTest="pricing-drawer-submit">
              {translate('text_17295436903260tlyb1gp1i7')}
            </form.SubmitButton>
          </form.AppForm>
        ),
        cancelOrCloseText: 'cancel',
        closeOnError: false,
        children: (
          <PricingDrawerContent
            form={form}
            currency={currency}
            onAddOnPayloadCapture={captureAddOnPayload}
            paymentTerm={options?.paymentTerm}
          />
        ),
      })
    },
    [formDrawer, translate, currency, form, captureAddOnPayload, options?.paymentTerm],
  )

  const syncEntitiesWithBlocks = useCallback(
    (blocks: PricingBlockAttributes[]): BillingItemsPayload | null => {
      // Blocks reference add-ons by localEntityIds (preferred) or legacy catalog entityIds.
      const activeRefIds = new Set(
        blocks.flatMap((b) => (b.localEntityIds?.length ? b.localEntityIds : b.entityIds)),
      )

      // Add-ons are canonically identified by their localId; the catalog addOnId
      // kept in entities/payloads is only a backward-compat alias (so legacy
      // blocks referencing the catalog id still resolve). An add-on survives if a
      // block references it by either its localId or its catalog alias — treating
      // the alias as its own orphan would wrongly prune add-ons on a no-op sync
      // (e.g. the editor's preview toggle, which fires an update).
      const allLocalIds = Object.keys(catalogIdMapRef.current)
      const removedLocalIds = allLocalIds.filter(
        (localId) =>
          !activeRefIds.has(localId) && !activeRefIds.has(catalogIdMapRef.current[localId]),
      )

      // A Cmd+Z can re-insert a block whose add-on was previously pruned; it is
      // referenced by its localId or its catalog alias but is no longer active.
      const restoredLocalIds = Object.keys(removedAddOnsRef.current).filter(
        (localId) =>
          activeRefIds.has(localId) || activeRefIds.has(removedAddOnsRef.current[localId].addOnId),
      )

      if (removedLocalIds.length === 0 && restoredLocalIds.length === 0) return null

      const updatedEntities = { ...entitiesRef.current }
      const updatedPayloads = { ...payloadsRef.current }

      // Prune deleted add-ons (stashing them for undo), then restore any whose
      // block re-appeared. Both mutate the working copies + shared refs in place.
      stashRemovedAddOns(
        removedLocalIds,
        catalogIdMapRef.current,
        updatedEntities,
        updatedPayloads,
        removedAddOnsRef.current,
      )
      restoreAddOns(
        restoredLocalIds,
        catalogIdMapRef.current,
        updatedEntities,
        updatedPayloads,
        removedAddOnsRef.current,
      )

      entitiesRef.current = updatedEntities
      payloadsRef.current = updatedPayloads
      setEntities(updatedEntities)

      // Re-key catalogIdMapRef in document order so toBillingItems assigns
      // positions matching the block order (a restored add-on would otherwise
      // land at the end of the map), then rebuild the surviving items — carrying
      // overrides — through toBillingItems.
      catalogIdMapRef.current = orderCatalogIdMapByBlocks(catalogIdMapRef.current, blocks)

      const survivingItems = buildSurvivingAddOnItems(catalogIdMapRef.current, updatedEntities)

      return toBillingItems(survivingItems, payloadsRef.current, currencyRef.current)
    },
    [],
  )

  const isPricingDisabled = useCallback(() => Object.keys(entitiesRef.current).length > 0, [])

  return { onPricingCommand, isPricingDisabled, entities, syncEntitiesWithBlocks }
}
