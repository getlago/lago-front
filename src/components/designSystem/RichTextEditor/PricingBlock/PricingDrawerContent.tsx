import { revalidateLogic } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { ComboboxItem } from '~/components/form'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import {
  CurrencyEnum,
  OrderTypeEnum,
  useGetAddOnsForFixedChargesSectionQuery,
  usePlansQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { MenuPopper } from '~/styles/designSystem'

import { type AddOnItem, pricingDrawerDefaultValues } from './constants'
import EditAddOnDrawer, { editAddOnDrawerDefaultValues } from './EditAddOnDrawer'

interface PricingDrawerContentExtraProps {
  quoteType: OrderTypeEnum
  currency: CurrencyEnum
}

const pricingDrawerContentDefaultProps: PricingDrawerContentExtraProps = {
  quoteType: OrderTypeEnum.OneOff,
  currency: CurrencyEnum.Usd,
}

const PricingDrawerContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: pricingDrawerContentDefaultProps,
  render: function PricingDrawerContent({ form, quoteType, currency }) {
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

    // Tracks pending (unselected) add-on rows — UI-only state
    const [pendingAddOnIndices, setPendingAddOnIndices] = useState<Set<number>>(new Set())

    const editDrawer = useFormDrawer()
    const editingIndexRef = useRef<number | null>(null)

    const editAddOnSchema = useMemo(
      () =>
        z.object({
          name: z.string(),
          description: z.string(),
          fromDatetime: z.string().min(1),
          toDatetime: z.string().min(1),
        }),
      [],
    )

    const editForm = useAppForm({
      defaultValues: editAddOnDrawerDefaultValues,
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: editAddOnSchema,
      },
      onSubmit: ({ value }) => {
        const index = editingIndexRef.current

        if (index === null) return

        form.setFieldValue(`addOnItems[${index}].name`, value.name)
        form.setFieldValue(`addOnItems[${index}].description`, value.description)
        form.setFieldValue(`addOnItems[${index}].fromDatetime`, value.fromDatetime)
        form.setFieldValue(`addOnItems[${index}].toDatetime`, value.toDatetime)
        editingIndexRef.current = null
        editDrawer.close()
      },
    })

    const openEditDrawer = (index: number, item: AddOnItem) => {
      editingIndexRef.current = index

      editForm.reset({
        name: item.name,
        description: item.description,
        fromDatetime: item.fromDatetime,
        toDatetime: item.toDatetime,
      })

      editDrawer.open({
        title: item.name,
        form: {
          id: 'edit-add-on-form',
          submit: () => editForm.handleSubmit(),
        },
        mainAction: (
          <Button data-test="edit-add-on-submit" type="submit">
            {translate('text_1779805897126caxqtv14ctd')}
          </Button>
        ),
        children: <EditAddOnDrawer form={editForm} />,
      })
    }

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
        <form.AppField name="planId">
          {(field) => (
            <ComboBox
              data={comboBoxData}
              loading={plansLoading}
              value={field.state.value}
              name={field.name}
              label={translate('text_63d3a658c6d84a5843032145')}
              placeholder={translate('text_63d3a658c6d84a5843032147')}
              onChange={(value) => field.handleChange(value)}
            />
          )}
        </form.AppField>
      )
    }

    return (
      <form.Field name="addOnItems" mode="array">
        {(addOnItemsField) => {
          const items = addOnItemsField.state.value

          const comboBoxData = addOns
            .filter((addOn) => !items.some((item) => item.addOnId === addOn.id))
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
            const newIndex = items.length
            const today = DateTime.now()

            addOnItemsField.pushValue({
              addOnId: '',
              name: '',
              code: '',
              description: '',
              units: '1',
              unitAmountCents: '',
              fromDatetime: today.startOf('day').toISO(),
              toDatetime: today.endOf('day').toISO(),
            })
            setPendingAddOnIndices((prev) => new Set(prev).add(newIndex))
          }

          const handleAddOnSelect = (index: number, addOnId: string) => {
            const addOn = addOns.find((a) => a.id === addOnId)

            if (!addOn) return

            form.setFieldValue(`addOnItems[${index}].addOnId`, addOn.id)
            form.setFieldValue(`addOnItems[${index}].name`, addOn.name)
            form.setFieldValue(`addOnItems[${index}].code`, addOn.code)
            form.setFieldValue(`addOnItems[${index}].description`, '')

            setPendingAddOnIndices((prev) => {
              const next = new Set(prev)

              next.delete(index)
              return next
            })
          }

          const handleRemoveAddOn = (index: number) => {
            addOnItemsField.removeValue(index)
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

          const handleEditAddOn = (index: number) => {
            openEditDrawer(index, items[index])
          }

          return (
            <div className="flex flex-col gap-6">
              {items.map((item, index) => {
                const isPending = pendingAddOnIndices.has(index)

                if (isPending) {
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
                                handleEditAddOn(index)
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
                      <form.AppField name={`addOnItems[${index}].units`}>
                        {(subField) => (
                          <subField.TextInputField
                            label={translate('text_65771fa3f4ab9a00720726ce')}
                            placeholder="0"
                            type="number"
                            className="flex-1"
                          />
                        )}
                      </form.AppField>

                      <form.AppField name={`addOnItems[${index}].unitAmountCents`}>
                        {(subField) => (
                          <subField.AmountInputField
                            label={translate('text_6453819268763979024ad089')}
                            currency={currency}
                            className="flex-1"
                          />
                        )}
                      </form.AppField>
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
        }}
      </form.Field>
    )
  },
})

export default PricingDrawerContent
