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
import { pricingDrawerDefaultValues } from '~/components/designSystem/RichTextEditor/PricingBlock/constants'
import PricingDrawerContent from '~/components/designSystem/RichTextEditor/PricingBlock/PricingDrawerContent'
import { useFormDrawer } from '~/components/drawers/useDrawer'
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
  customerCurrency?: CurrencyEnum | null,
): UseOneOffPricingDrawerReturn => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const formDrawer = useFormDrawer()
  const entitiesRef = useRef<Record<string, EntityData>>({})
  const [entities, setEntities] = useState<Record<string, EntityData>>({})
  const payloadsRef = useRef<Record<string, AddOnPayload>>({})
  const catalogIdMapRef = useRef<Record<string, string>>({})
  const onSaveRef = useRef<
    | ((
        attrs: PricingBlockAttributes,
        entityData: Record<string, EntityData>,
        billingItems?: BillingItemsPayload,
      ) => void)
    | null
  >(null)

  // Hydrate from saved billingItems on mount / when quote data arrives
  useEffect(() => {
    if (!initialBillingItems) return

    const parsed = initialBillingItems as BillingItemsPayload

    if (!parsed.addons?.length) return

    const { entities: formattedEntities, originalPayloads, addOnItems } = fromBillingItems(parsed)

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
  }, [initialBillingItems])

  const captureAddOnPayload = useCallback(
    (localId: string, addOn: AddOnForPricingSectionFragment) => {
      catalogIdMapRef.current[localId] = addOn.id
      payloadsRef.current[localId] = {
        position: 0, // will be set correctly by toBillingItems
        code: addOn.code,
        name: addOn.name,
        description: addOn.description ?? '',
        units: 1,
        unit_amount_cents: Number(addOn.amountCents),
        total_amount_cents: Number(addOn.amountCents), // units=1 × amountCents
        invoice_display_name: addOn.invoiceDisplayName ?? '',
        from_datetime: null,
        to_datetime: null,
        tax_codes: addOn.taxes?.map((t) => t.code) ?? [],
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
    onSubmit: ({ value }) => {
      const confirmedItems = value.addOnItems.filter((item) => item.addOnId)

      if (confirmedItems.length === 0) return

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

      const billingItems = toBillingItems(confirmedItems, payloadsRef.current)

      onSaveRef.current?.(
        {
          pricingType: 'addOns' as const,
          entityIds: confirmedItems.map((item) => item.addOnId),
          localEntityIds: confirmedItems.map((item) => item.localId),
        },
        entityData,
        billingItems,
      )
      const updatedAddOns = { ...entitiesRef.current, ...entityData }

      entitiesRef.current = updatedAddOns
      setEntities(updatedAddOns)
    },
  })

  const onPricingCommand: OnPricingCommand = useCallback(
    ({ onSave, editData }) => {
      // Only allow one pricing block (new insertion only, not edits)
      if (!editData && Object.keys(entitiesRef.current).length > 0) {
        return
      }

      const currency = customerCurrency ?? organization?.defaultCurrency ?? CurrencyEnum.Usd

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
        await form.handleSubmit()

        if (!form.state.canSubmit) {
          throw new Error('Validation failed')
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
    [formDrawer, translate, organization?.defaultCurrency, form, captureAddOnPayload],
  )

  const syncEntitiesWithBlocks = useCallback(
    (blocks: PricingBlockAttributes[]): BillingItemsPayload | null => {
      const activeEntityIds = new Set(
        blocks.flatMap((b) => (b.localEntityIds?.length ? b.localEntityIds : b.entityIds)),
      )

      const currentKeys = Object.keys(entitiesRef.current)
      const orphanedKeys = currentKeys.filter((id) => !activeEntityIds.has(id))

      if (orphanedKeys.length === 0) return null

      const updatedEntities = { ...entitiesRef.current }
      const updatedPayloads = { ...payloadsRef.current }

      for (const key of orphanedKeys) {
        delete updatedEntities[key]
        delete updatedPayloads[key]
      }

      entitiesRef.current = updatedEntities
      payloadsRef.current = updatedPayloads
      setEntities(updatedEntities)

      // Rebuild billing items from remaining payloads
      const remainingIds = Object.keys(updatedPayloads)

      return {
        addons: remainingIds.map((id, i) => ({
          type: 'addon' as const,
          id,
          payload: { ...updatedPayloads[id], position: i + 1 },
          overrides: {},
        })),
      }
    },
    [],
  )

  const isPricingDisabled = useCallback(() => Object.keys(entitiesRef.current).length > 0, [])

  return { onPricingCommand, isPricingDisabled, entities, syncEntitiesWithBlocks }
}
