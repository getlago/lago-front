import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useRef } from 'react'
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
import {
  type AddOnForFixedChargesSectionFragment,
  CurrencyEnum,
  OrderTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// --- Hook ---

const PRICING_DRAWER_FORM_ID = 'pricing-drawer-form'

interface UsePricingDrawerReturn {
  onPricingCommand: OnPricingCommand
  entities: Record<string, EntityData>
}

export const usePricingDrawer = (
  quoteOrderType: OrderTypeEnum | undefined,
  initialBillingItems?: unknown,
): UsePricingDrawerReturn => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const formDrawer = useFormDrawer()
  const entitiesRef = useRef<Record<string, EntityData>>({})
  const payloadsRef = useRef<Record<string, AddOnPayload>>({})
  const onSaveRef = useRef<
    | ((
        attrs: PricingBlockAttributes,
        entityData: Record<string, EntityData>,
        billingItems?: BillingItemsPayload,
      ) => void)
    | null
  >(null)
  const quoteOrderTypeRef = useRef(quoteOrderType)

  quoteOrderTypeRef.current = quoteOrderType

  // Hydrate from saved billingItems on mount / when quote data arrives
  useEffect(() => {
    if (!initialBillingItems) return

    const parsed = initialBillingItems as BillingItemsPayload

    if (!parsed.addons?.length) return

    const { entities, originalPayloads } = fromBillingItems(parsed)

    entitiesRef.current = { ...entitiesRef.current, ...entities }
    payloadsRef.current = { ...payloadsRef.current, ...originalPayloads }
  }, [initialBillingItems])

  const captureAddOnPayload = useCallback(
    (addOnId: string, addOn: AddOnForFixedChargesSectionFragment) => {
      payloadsRef.current[addOnId] = {
        position: 0, // will be set correctly by toBillingItems
        add_on_code: addOn.code,
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
          const orderType = quoteOrderTypeRef.current ?? OrderTypeEnum.SubscriptionCreation
          const isPlanSelection =
            orderType === OrderTypeEnum.SubscriptionCreation ||
            orderType === OrderTypeEnum.SubscriptionAmendment

          if (isPlanSelection) return

          // One-off: at least one confirmed add-on
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
      const orderType = quoteOrderTypeRef.current ?? OrderTypeEnum.SubscriptionCreation
      const isPlanSelection =
        orderType === OrderTypeEnum.SubscriptionCreation ||
        orderType === OrderTypeEnum.SubscriptionAmendment

      if (isPlanSelection) {
        if (!value.planId) return

        const entityData: Record<string, EntityData> = {
          [value.planId]: {
            entityId: value.planId,
            entityType: 'plan',
            name: value.planId,
            code: '',
          },
        }

        onSaveRef.current?.({ pricingType: 'plan' as const, entityIds: [value.planId] }, entityData)
        entitiesRef.current = { ...entitiesRef.current, ...entityData }
      } else {
        const confirmedItems = value.addOnItems.filter((item) => item.addOnId)

        if (confirmedItems.length === 0) return

        const entityData: Record<string, EntityData> = {}

        confirmedItems.forEach((item) => {
          entityData[item.addOnId] = {
            entityId: item.addOnId,
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
          { pricingType: 'addOns' as const, entityIds: confirmedItems.map((item) => item.addOnId) },
          entityData,
          billingItems,
        )
        entitiesRef.current = { ...entitiesRef.current, ...entityData }
      }
    },
  })

  const onPricingCommand: OnPricingCommand = useCallback(
    ({ onSave, editData }) => {
      const orderType = quoteOrderTypeRef.current ?? OrderTypeEnum.SubscriptionCreation
      const isPlanSelection =
        orderType === OrderTypeEnum.SubscriptionCreation ||
        orderType === OrderTypeEnum.SubscriptionAmendment

      const currency = organization?.defaultCurrency ?? CurrencyEnum.Usd

      onSaveRef.current = onSave

      // Build initial values from editData
      const initialPlanId =
        isPlanSelection && editData?.pricingType === 'plan' ? editData.entityIds[0] : ''

      const initialAddOnItems =
        !isPlanSelection && editData?.pricingType === 'addOns'
          ? editData.entityIds.map((id) => {
              const existing = entitiesRef.current[id]

              const today = DateTime.now()

              return {
                addOnId: id,
                name: existing?.name ?? id,
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

      form.reset({
        planId: initialPlanId,
        addOnItems: initialAddOnItems,
      })

      const handleSubmit = () => {
        form.handleSubmit()
      }

      formDrawer.open({
        title:
          orderType === OrderTypeEnum.OneOff
            ? translate('text_17799586575620rdqef1d7dq')
            : translate('text_17799586575628qyl2jk1tbn'),
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
        children: (
          <PricingDrawerContent
            form={form}
            quoteType={orderType}
            currency={currency}
            onAddOnPayloadCapture={captureAddOnPayload}
          />
        ),
      })
    },
    [formDrawer, translate, organization?.defaultCurrency, form, captureAddOnPayload],
  )

  return { onPricingCommand, entities: entitiesRef.current }
}
