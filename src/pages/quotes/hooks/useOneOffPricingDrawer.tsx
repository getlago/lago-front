import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
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

export const useOneOffPricingDrawer = (
  initialBillingItems?: unknown,
  quoteCurrency?: CurrencyEnum | null,
): UseOneOffPricingDrawerReturn => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const formDrawer = useFormDrawer()

  // The quote currency drives amount cents (de)serialization. Kept in a ref so
  // the stable callbacks (form onSubmit, syncEntitiesWithBlocks) always read the
  // latest value without depending on it.
  const currency = quoteCurrency ?? organization?.defaultCurrency ?? CurrencyEnum.Usd
  const currencyRef = useRef(currency)

  currencyRef.current = currency
  const entitiesRef = useRef<Record<string, EntityData>>({})
  const [entities, setEntities] = useState<Record<string, EntityData>>({})
  const payloadsRef = useRef<Record<string, AddOnPayload>>({})
  const catalogIdMapRef = useRef<Record<string, string>>({})
  const onSaveRef = useRef<
    | ((
        attrs: PricingBlockAttributes,
        entityData: Record<string, EntityData>,
        billingItems?: BillingItemsPayload,
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
    onSubmit: async ({ value }) => {
      const confirmedItems = value.addOnItems.filter((item) => item.addOnId)

      if (confirmedItems.length === 0) return

      const fieldPaths = confirmedItems.map(
        (_item, index) => `addOnItems[${index}].unitAmountCents`,
      )
      const unitPaths = confirmedItems.map((_item, index) => `addOnItems[${index}].units`)

      clearServerFieldErrors(form, [...fieldPaths, ...unitPaths])

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

      const result = (await onSaveRef.current?.(attrs, entityData, billingItems)) as
        SavePricingResult | undefined

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
          <Button data-test="pricing-drawer-submit" type="submit">
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        ),
        cancelOrCloseText: 'cancel',
        closeOnError: false,
        children: (
          <PricingDrawerContent
            form={form}
            currency={currency}
            onAddOnPayloadCapture={captureAddOnPayload}
          />
        ),
      })
    },
    [formDrawer, translate, currency, form, captureAddOnPayload],
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

      if (removedLocalIds.length === 0) return null

      // Prune the deleted add-ons (and their alias keys) from local state.
      const updatedEntities = { ...entitiesRef.current }
      const updatedPayloads = { ...payloadsRef.current }

      for (const localId of removedLocalIds) {
        const addOnId = catalogIdMapRef.current[localId]

        delete updatedEntities[localId]
        delete updatedEntities[addOnId]
        delete updatedPayloads[localId]
        delete updatedPayloads[addOnId]
        delete catalogIdMapRef.current[localId]
      }

      entitiesRef.current = updatedEntities
      payloadsRef.current = updatedPayloads
      setEntities(updatedEntities)

      // Rebuild the surviving billing items through toBillingItems so the user's
      // overrides (units, unit price, dates, names) are preserved — rebuilding
      // straight from the catalog payloads would reset them to catalog defaults.
      const survivingItems: AddOnItem[] = Object.keys(catalogIdMapRef.current)
        .map((localId): AddOnItem | null => {
          const entity = updatedEntities[localId]

          if (!entity) return null

          return {
            localId,
            addOnId: catalogIdMapRef.current[localId],
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

      return toBillingItems(survivingItems, payloadsRef.current, currencyRef.current)
    },
    [],
  )

  const isPricingDisabled = useCallback(() => Object.keys(entitiesRef.current).length > 0, [])

  return { onPricingCommand, isPricingDisabled, entities, syncEntitiesWithBlocks }
}
