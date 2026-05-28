import { useCallback, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import type {
  EntityData,
  OnPricingCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { PricingBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/PricingBlock.schema'
import PricingDrawerContent from '~/components/designSystem/RichTextEditor/PricingBlock/PricingDrawerContent'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { CurrencyEnum, OrderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// --- Hook ---

const PRICING_DRAWER_FORM_ID = 'pricing-drawer-form'

interface UsePricingDrawerReturn {
  onPricingCommand: OnPricingCommand
  entities: Record<string, EntityData>
}

export const usePricingDrawer = (
  quoteOrderType: OrderTypeEnum | undefined,
): UsePricingDrawerReturn => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const formDrawer = useFormDrawer()
  const [entities, setEntities] = useState<Record<string, EntityData>>({})
  const selectedRef = useRef<{
    attrs: PricingBlockAttributes
    entityData: Record<string, EntityData>
  } | null>(null)
  const quoteOrderTypeRef = useRef(quoteOrderType)

  quoteOrderTypeRef.current = quoteOrderType

  const onPricingCommand: OnPricingCommand = useCallback(
    ({ onSave, editData }) => {
      const orderType = quoteOrderTypeRef.current ?? OrderTypeEnum.SubscriptionCreation
      const isPlanSelection =
        orderType === OrderTypeEnum.SubscriptionCreation ||
        orderType === OrderTypeEnum.SubscriptionAmendment

      const currency = organization?.defaultCurrency ?? CurrencyEnum.Usd

      selectedRef.current = null

      // Build initial values from editData
      const initialPlanId =
        isPlanSelection && editData?.pricingType === 'plan' ? editData.entityIds[0] : undefined

      const initialAddOnItems =
        !isPlanSelection && editData?.pricingType === 'addOns'
          ? editData.entityIds.map((id) => {
              const existing = entities[id]

              return {
                addOnId: id,
                name: existing?.name ?? id,
                code: existing?.code ?? '',
                units: existing?.units ?? '1',
                unitAmountCents: existing?.unitAmountCents ?? '0',
              }
            })
          : undefined

      formDrawer.open({
        title:
          orderType === OrderTypeEnum.OneOff
            ? translate('text_17799586575620rdqef1d7dq')
            : translate('text_17799586575628qyl2jk1tbn'),
        children: (
          <PricingDrawerContent
            quoteType={orderType}
            currency={currency}
            initialPlanId={initialPlanId}
            initialAddOnItems={initialAddOnItems}
            onChangeSelection={(data) => {
              if (isPlanSelection) {
                if (data.planId) {
                  selectedRef.current = {
                    attrs: { pricingType: 'plan', entityIds: [data.planId] },
                    entityData: {
                      [data.planId]: {
                        entityId: data.planId,
                        entityType: 'plan',
                        name: data.planName ?? data.planId,
                        code: data.planCode ?? '',
                      },
                    },
                  }
                } else {
                  selectedRef.current = null
                }
              } else {
                const items = data.addOnItems ?? []

                if (items.length > 0) {
                  const entityData: Record<string, EntityData> = {}

                  items.forEach((item) => {
                    entityData[item.addOnId] = {
                      entityId: item.addOnId,
                      entityType: 'addOn',
                      name: item.name,
                      code: item.code,
                      units: item.units,
                      unitAmountCents: item.unitAmountCents,
                    }
                  })

                  selectedRef.current = {
                    attrs: {
                      pricingType: 'addOns',
                      entityIds: items.map((item) => item.addOnId),
                    },
                    entityData,
                  }
                } else {
                  selectedRef.current = null
                }
              }
            }}
          />
        ),
        mainAction: (
          <Button data-test="pricing-drawer-submit" type="submit">
            {translate('text_1779805897126caxqtv14ctd')}
          </Button>
        ),
        form: {
          id: PRICING_DRAWER_FORM_ID,
          submit: () => {
            if (!selectedRef.current) {
              throw new Error('No pricing selection')
            }

            const { attrs, entityData } = selectedRef.current

            onSave(attrs, entityData)
            setEntities((prev) => ({ ...prev, ...entityData }))
          },
        },
      })
    },
    [formDrawer, translate, organization?.defaultCurrency, entities],
  )

  return { onPricingCommand, entities }
}
