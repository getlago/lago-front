import { Icon } from 'lago-design-system'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { ComboboxItem } from '~/components/form'
import { AmountInput } from '~/components/form/AmountInput/AmountInput'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { TextInput } from '~/components/form/TextInput/TextInput'
import {
  CurrencyEnum,
  OrderTypeEnum,
  useGetAddOnsForFixedChargesSectionQuery,
  usePlansQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles/designSystem'

import type { AddOnItem } from './constants'

interface PricingDrawerContentProps {
  quoteType: OrderTypeEnum
  currency: CurrencyEnum
  initialPlanId?: string
  initialAddOnItems?: AddOnItem[]
  onChangeSelection: (data: {
    planId?: string
    planName?: string
    planCode?: string
    addOnItems?: AddOnItem[]
  }) => void
}

const PricingDrawerContent = ({
  quoteType,
  currency,
  initialPlanId,
  initialAddOnItems,
  onChangeSelection,
}: PricingDrawerContentProps) => {
  const { translate } = useInternationalization()
  const isPlanSelection =
    quoteType === OrderTypeEnum.SubscriptionCreation ||
    quoteType === OrderTypeEnum.SubscriptionAmendment

  const { data: plansData, loading: plansLoading } = usePlansQuery({
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: !isPlanSelection,
  })

  const { data: addOnsData, loading: addOnsLoading } = useGetAddOnsForFixedChargesSectionQuery({
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: isPlanSelection,
  })

  const plans = useMemo(() => plansData?.plans?.collection ?? [], [plansData])
  const addOns = useMemo(() => addOnsData?.addOns?.collection ?? [], [addOnsData])

  // Plan selection state
  const [planId, setPlanId] = useState(initialPlanId ?? '')

  // Add-on selection state
  const [addOnItems, setAddOnItems] = useState<AddOnItem[]>(initialAddOnItems ?? [])
  // Tracks pending (unselected) add-on rows
  const [pendingAddOnIndices, setPendingAddOnIndices] = useState<Set<number>>(new Set())

  // Notify parent of selection changes
  useEffect(() => {
    if (isPlanSelection) {
      const plan = plans.find((p) => p.id === planId)

      onChangeSelection({
        planId: planId || undefined,
        planName: plan?.name,
        planCode: plan?.code,
      })
    } else {
      onChangeSelection({ addOnItems })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, addOnItems, isPlanSelection])

  if (isPlanSelection) {
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
      <ComboBox
        data={comboBoxData}
        loading={plansLoading}
        value={planId}
        label={translate('text_63d3a658c6d84a5843032145')}
        placeholder={translate('text_63d3a658c6d84a5843032147')}
        onChange={(value) => setPlanId(value)}
      />
    )
  }

  const comboBoxData = addOns
    .filter((addOn) => !addOnItems.some((item) => item.addOnId === addOn.id))
    .map((addOn) => ({
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

  const handleAddPendingRow = () => {
    const newIndex = addOnItems.length

    // Add a placeholder item
    setAddOnItems((prev) => [
      ...prev,
      { addOnId: '', name: '', code: '', units: '1', unitAmountCents: '' },
    ])
    setPendingAddOnIndices((prev) => new Set(prev).add(newIndex))
  }

  const handleAddOnSelect = (index: number, addOnId: string) => {
    const addOn = addOns.find((a) => a.id === addOnId)

    if (!addOn) return

    setAddOnItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, addOnId: addOn.id, name: addOn.name, code: addOn.code } : item,
      ),
    )
    setPendingAddOnIndices((prev) => {
      const next = new Set(prev)

      next.delete(index)
      return next
    })
  }

  const handleRemoveAddOn = (index: number) => {
    setAddOnItems((prev) => prev.filter((_, i) => i !== index))
    // Recompute pending indices after removal
    setPendingAddOnIndices((prev) => {
      const next = new Set<number>()

      prev.forEach((i) => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const handleUpdateItem = (index: number, field: keyof AddOnItem, value: string) => {
    setAddOnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {addOnItems.map((item, index) => {
        const isPending = pendingAddOnIndices.has(index)

        if (isPending) {
          // Pending row: ComboBox + delete button
          return (
            <div
              key={`pending-${index}`}
              className="flex items-end gap-3"
              data-test={`add-on-pending-${index}`}
            >
              <ComboBox
                className="flex-1"
                data={comboBoxData}
                loading={addOnsLoading}
                value=""
                label={translate('text_1779802343220xh5jm32or13')}
                placeholder={translate('text_17798023432203q6hytdp7om')}
                onChange={(value) => {
                  if (value) {
                    handleAddOnSelect(index, value)
                  }
                }}
              />
              <Button
                variant="quaternary"
                size="medium"
                icon="trash"
                onClick={() => handleRemoveAddOn(index)}
                data-test={`remove-add-on-${index}`}
              />
            </div>
          )
        }

        // Selected add-on row: name/code + popper menu + unit/price inputs
        return (
          <div
            key={item.addOnId}
            className="flex flex-col gap-3 rounded-xl border border-grey-300 p-4"
            data-test={`add-on-item-${index}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="puzzle" color="dark" />
                <div className="flex flex-col">
                  <Typography variant="bodyHl" color="grey700">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="grey600">
                    {item.code}
                  </Typography>
                </div>
              </div>
              <Popper
                PopperProps={{ placement: 'bottom-end' }}
                opener={
                  <Button
                    variant="quaternary"
                    size="small"
                    icon="dots-horizontal"
                    data-test={`add-on-actions-${index}`}
                  />
                }
              >
                {({ closePopper }) => (
                  <MenuPopper>
                    <Button
                      startIcon="pen"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        // Convert back to pending to allow re-selection
                        setAddOnItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, addOnId: '', name: '', code: '' } : it,
                          ),
                        )
                        setPendingAddOnIndices((prev) => new Set(prev).add(index))
                        closePopper()
                      }}
                    >
                      {translate('text_63aa15caab5b16980b21b0b8')}
                    </Button>
                    <Button
                      startIcon="trash"
                      variant="quaternary"
                      align="left"
                      onClick={() => {
                        handleRemoveAddOn(index)
                        closePopper()
                      }}
                    >
                      {translate('text_63aa085d28b8510cd46443ff')}
                    </Button>
                  </MenuPopper>
                )}
              </Popper>
            </div>

            <div className="flex gap-3">
              <TextInput
                label={translate('text_65771fa3f4ab9a00720726ce')}
                placeholder="0"
                type="number"
                value={item.units}
                className="flex-1"
                onChange={(value) => handleUpdateItem(index, 'units', value)}
              />

              <AmountInput
                label={translate('text_6453819268763979024ad089')}
                currency={currency}
                value={item.unitAmountCents}
                className="flex-1"
                onChange={(value) => handleUpdateItem(index, 'unitAmountCents', value)}
              />
            </div>
          </div>
        )
      })}

      <Button
        variant="quaternary"
        startIcon="plus"
        onClick={handleAddPendingRow}
        data-test="add-add-on-button"
      >
        {translate('text_1779802343220xh5jm32or13')}
      </Button>
    </div>
  )
}

export default PricingDrawerContent
