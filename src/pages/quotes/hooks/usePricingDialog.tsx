import { useCallback, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import type {
  EntityData,
  OnPricingCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { PricingBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/PricingBlock.schema'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { ComboboxItem } from '~/components/form'
import {
  OrderTypeEnum,
  useGetAddOnsForFixedChargesSectionQuery,
  usePlansQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

// --- Drawer content components ---

interface PlanSelectContentProps {
  onSelect: (entity: { id: string; name: string; code: string } | undefined) => void
  editEntityId?: string
}

const PlanSelectContent = ({ onSelect, editEntityId }: PlanSelectContentProps) => {
  const { translate } = useInternationalization()
  const { data, loading } = usePlansQuery({
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const form = useAppForm({
    defaultValues: { planId: editEntityId ?? '' },
  })

  const plans = data?.plans?.collection ?? []

  const comboBoxData = plans.map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code})`,
    labelNode: (
      <ComboboxItem>
        <Typography variant="body" color="grey700" noWrap>
          {plan.name}
        </Typography>
        <Typography variant="caption" color="grey600" noWrap>
          {plan.code}
        </Typography>
      </ComboboxItem>
    ),
  }))

  return (
    <form.AppField
      name="planId"
      listeners={{
        onChange: ({ value }) => {
          const plan = plans.find((p) => p.id === value)

          onSelect(plan ? { id: plan.id, name: plan.name, code: plan.code } : undefined)
        },
      }}
    >
      {(field) => (
        <field.ComboBoxField
          data={comboBoxData}
          loading={loading}
          label={translate('text_63d3a658c6d84a5843032145')}
          placeholder={translate('text_63d3a658c6d84a5843032147')}
        />
      )}
    </form.AppField>
  )
}

interface AddOnSelectContentProps {
  onSelect: (entities: { id: string; name: string; code: string }[]) => void
  editEntityIds?: string[]
}

const AddOnSelectContent = ({ onSelect, editEntityIds }: AddOnSelectContentProps) => {
  const { translate } = useInternationalization()
  const { data, loading } = useGetAddOnsForFixedChargesSectionQuery({
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const form = useAppForm({
    defaultValues: { addOnIds: editEntityIds ?? ([] as string[]) },
  })

  const addOns = data?.addOns?.collection ?? []

  const comboBoxData = addOns.map((addOn) => ({
    value: addOn.id,
    label: `${addOn.name} (${addOn.code})`,
    labelNode: (
      <ComboboxItem>
        <Typography variant="body" color="grey700" noWrap>
          {addOn.name}
        </Typography>
        <Typography variant="caption" color="grey600" noWrap>
          {addOn.code}
        </Typography>
      </ComboboxItem>
    ),
  }))

  return (
    <form.AppField
      name="addOnIds"
      listeners={{
        onChange: ({ value }) => {
          const selected = (value ?? [])
            .map((id) => {
              const addOn = addOns.find((a) => a.id === id)

              return addOn ? { id: addOn.id, name: addOn.name, code: addOn.code } : undefined
            })
            .filter(Boolean) as { id: string; name: string; code: string }[]

          onSelect(selected)
        },
      }}
    >
      {(field) => (
        <field.MultipleComboBoxField
          data={comboBoxData}
          loading={loading}
          label={translate('text_1779802343220xh5jm32or13')}
          placeholder={translate('text_17798023432203q6hytdp7om')}
        />
      )}
    </form.AppField>
  )
}

// --- Hook ---

const PRICING_DRAWER_FORM_ID = 'pricing-drawer-form'

interface UsePricingDialogReturn {
  onPricingCommand: OnPricingCommand
  entities: Record<string, EntityData>
}

export const usePricingDialog = (
  quoteOrderType: OrderTypeEnum | undefined,
): UsePricingDialogReturn => {
  const { translate } = useInternationalization()
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

      selectedRef.current = null

      formDrawer.open({
        title: translate('text_1779802343219a1cl5ckvtrn'),
        children: isPlanSelection ? (
          <PlanSelectContent
            editEntityId={editData?.pricingType === 'plan' ? editData.entityIds[0] : undefined}
            onSelect={(plan) => {
              if (plan) {
                selectedRef.current = {
                  attrs: { pricingType: 'plan', entityIds: [plan.id] },
                  entityData: {
                    [plan.id]: {
                      entityId: plan.id,
                      entityType: 'plan',
                      name: plan.name,
                      code: plan.code,
                    },
                  },
                }
              } else {
                selectedRef.current = null
              }
            }}
          />
        ) : (
          <AddOnSelectContent
            editEntityIds={editData?.pricingType === 'addOns' ? editData.entityIds : undefined}
            onSelect={(addOns) => {
              if (addOns.length > 0) {
                const entityData: Record<string, EntityData> = {}

                addOns.forEach((a) => {
                  entityData[a.id] = {
                    entityId: a.id,
                    entityType: 'addOn',
                    name: a.name,
                    code: a.code,
                  }
                })

                selectedRef.current = {
                  attrs: { pricingType: 'addOns', entityIds: addOns.map((a) => a.id) },
                  entityData,
                }
              } else {
                selectedRef.current = null
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
    [formDrawer, translate],
  )

  return { onPricingCommand, entities }
}
