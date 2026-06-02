import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { ComboboxItem } from '~/components/form'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  type AddOnForPricingSectionFragment,
  CurrencyEnum,
  useGetAddOnsForPricingSectionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { MenuPopper } from '~/styles/designSystem'

import { type AddOnItem, pricingDrawerDefaultValues } from './constants'
import EditAddOnDrawer, { editAddOnDrawerDefaultValues } from './EditAddOnDrawer'

gql`
  fragment AddOnForPricingSection on AddOn {
    id
    name
    code
    invoiceDisplayName
    description
    amountCents
    amountCurrency
    taxes {
      id
      code
    }
  }

  query getAddOnsForPricingSection($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...AddOnForPricingSection
      }
    }
  }
`

interface AddOnSelectionContentExtraProps {
  currency: CurrencyEnum
  onAddOnPayloadCapture?: (addOnId: string, addOn: AddOnForPricingSectionFragment) => void
}

const addOnSelectionContentDefaultProps: AddOnSelectionContentExtraProps = {
  currency: CurrencyEnum.Usd,
  onAddOnPayloadCapture: undefined,
}

const AddOnSelectionContent = withForm({
  defaultValues: pricingDrawerDefaultValues,
  props: addOnSelectionContentDefaultProps,
  render: function AddOnSelectionContent({ form, currency, onAddOnPayloadCapture }) {
    const { translate } = useInternationalization()
    const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

    const { data: addOnsData, loading: addOnsLoading } = useGetAddOnsForPricingSectionQuery({
      variables: { limit: 100 },
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })

    const addOns = useMemo(() => addOnsData?.addOns?.collection ?? [], [addOnsData])

    // Tracks pending (unselected) add-on rows — UI-only state
    const [pendingAddOnIndices, setPendingAddOnIndices] = useState<Set<number>>(new Set())

    const editDrawer = useFormDrawer()
    const editingIndexRef = useRef<number | null>(null)

    const editAddOnSchema = useMemo(
      () =>
        z.object({
          invoiceDisplayName: z.string(),
          description: z.string(),
          fromDatetime: z.string().min(1, { message: translate('text_1780327356834f5f3nndfg80') }),
          toDatetime: z.string().min(1, { message: translate('text_17803273568346wguor4j5u5') }),
        }),
      [translate],
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

        form.setFieldValue(`addOnItems[${index}].invoiceDisplayName`, value.invoiceDisplayName)
        form.setFieldValue(`addOnItems[${index}].description`, value.description)
        form.setFieldValue(`addOnItems[${index}].fromDatetime`, value.fromDatetime)
        form.setFieldValue(`addOnItems[${index}].toDatetime`, value.toDatetime)
        editingIndexRef.current = null
        editDrawer.close()
      },
    })

    const openEditDrawer = (index: number, item: AddOnItem) => {
      editingIndexRef.current = index

      // Clear validation errors and field meta, then set values individually.
      // Using reset(values) would update options.defaultValues, which gets
      // overwritten back to empty by useForm's update() layout effect on re-render.
      editForm.reset()
      editForm.setFieldValue('invoiceDisplayName', item.invoiceDisplayName)
      editForm.setFieldValue('description', item.description)
      editForm.setFieldValue('fromDatetime', item.fromDatetime)
      editForm.setFieldValue('toDatetime', item.toDatetime)

      editDrawer.open({
        title: translate('text_1780302522400cvm8js8nfg2'),
        closeOnError: false,
        form: {
          id: 'edit-add-on-form',
          submit: async () => {
            await editForm.handleSubmit()

            if (!editForm.state.canSubmit) {
              throw new Error('Validation failed')
            }
          },
        },
        mainAction: (
          <Button data-test="edit-add-on-submit" type="submit">
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        ),
        children: <EditAddOnDrawer form={editForm} />,
      })
    }

    return (
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          <Typography variant="headline">{translate('text_17799586575620rdqef1d7dq')}</Typography>
          <Typography variant="body">{translate('text_17800447462496abqig1cu57')}</Typography>
        </div>
        <div className="flex flex-col gap-8">
          <Typography variant="subhead1" color="grey700">
            {translate('text_17800447462496h0wm2w3btg')}
          </Typography>
          <div className="flex flex-col">
            <div className="flex h-11 flex-col justify-center shadow-b">
              <Typography variant="bodyHl" color="grey500">
                {translate('text_17800447462491xl4jay915z')}
              </Typography>
            </div>
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
                    invoiceDisplayName: '',
                    code: '',
                    description: '',
                    units: '1',
                    unitAmountCents: '',
                    totalAmount: '',
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
                  form.setFieldValue(
                    `addOnItems[${index}].invoiceDisplayName`,
                    addOn.invoiceDisplayName ?? '',
                  )
                  form.setFieldValue(`addOnItems[${index}].code`, addOn.code)
                  form.setFieldValue(`addOnItems[${index}].description`, '')
                  form.setFieldValue(`addOnItems[${index}].totalAmount`, '')

                  onAddOnPayloadCapture?.(addOn.id, addOn)

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
                  <div className="flex flex-col">
                    {items.map((item, index) => {
                      const isPending = pendingAddOnIndices.has(index)

                      if (isPending) {
                        return (
                          <div
                            key={`pending-${index}`}
                            className="mt-8 grid grid-cols-[1fr_auto] items-center gap-3"
                            data-test={`add-on-pending-${index}`}
                          >
                            <ComboBox
                              className="flex-1"
                              data={comboBoxData}
                              loading={addOnsLoading}
                              value=""
                              placeholder={translate('text_17798023432203q6hytdp7om')}
                              onChange={(value) => {
                                if (value) {
                                  handleAddOnSelect(index, value)
                                }
                              }}
                            />
                            <Tooltip
                              title={translate('text_628b8c693e464200e00e4a10')}
                              placement="top-end"
                            >
                              <Button
                                variant="quaternary"
                                size="small"
                                icon="trash"
                                onClick={() => handleRemoveAddOn(index)}
                                data-test={`remove-add-on-${index}`}
                              />
                            </Tooltip>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={item.addOnId}
                          className="flex flex-col gap-3 pb-6 pt-3 shadow-b"
                          data-test={`add-on-item-${index}`}
                        >
                          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                            <div className="flex flex-col">
                              <Typography variant="captionHl" color="grey600">
                                {translate('text_633dae57ca9a923dd53c2097', {
                                  fromDate: intlFormatDateTimeOrgaTZ(item.fromDatetime).date,
                                  toDate: intlFormatDateTimeOrgaTZ(item.toDatetime).date,
                                })}
                              </Typography>
                              <Typography variant="bodyHl" color="grey700">
                                {item.invoiceDisplayName || item.name}
                              </Typography>
                              <Typography variant="caption" color="grey600">
                                {item.description}
                              </Typography>
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

                          <div className="grid grid-cols-[1fr_1fr_2fr] gap-3">
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
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        {getCurrencySymbol(currency)}
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              )}
                            </form.AppField>
                            <form.Subscribe
                              selector={(state) => ({
                                units: state.values.addOnItems?.[index]?.units,
                                unitAmountCents: state.values.addOnItems?.[index]?.unitAmountCents,
                                totalAmount: state.values.addOnItems?.[index]?.totalAmount,
                              })}
                            >
                              {({ units, unitAmountCents, totalAmount }) => {
                                const computed =
                                  (parseFloat(units) || 0) * (parseFloat(unitAmountCents) || 0)
                                const computedStr = String(computed)

                                if (computedStr !== totalAmount) {
                                  // Defer the state update to avoid setting state during render
                                  setTimeout(() => {
                                    form.setFieldValue(
                                      `addOnItems[${index}].totalAmount`,
                                      computedStr,
                                    )
                                  }, 0)
                                }

                                return (
                                  <div className="flex flex-col gap-1">
                                    <Typography variant="captionHl" color="grey700" align="right">
                                      {translate('text_17800586916250mj95szdi21')}
                                    </Typography>
                                    <Typography
                                      variant="body"
                                      color="grey700"
                                      className="flex h-12 items-center justify-end"
                                    >
                                      {intlFormatNumber(computed, { currency })}
                                    </Typography>
                                  </div>
                                )
                              }}
                            </form.Subscribe>
                          </div>
                        </div>
                      )
                    })}

                    <Button
                      variant="inline"
                      startIcon="plus"
                      align="left"
                      className="mt-8"
                      onClick={handleAddPendingRow}
                      data-test="add-add-on-button"
                    >
                      {translate('text_1779802343220xh5jm32or13')}
                    </Button>
                    <form.Subscribe selector={(state) => state.values.addOnItems}>
                      {(addOnItems) => {
                        const grandTotal = addOnItems.reduce(
                          (sum, item) => sum + (parseFloat(item.totalAmount) || 0),
                          0,
                        )

                        return (
                          <div className="mt-8 flex justify-end">
                            <div className="flex w-1/2 justify-between">
                              <Typography variant="bodyHl" color="grey700">
                                {translate('text_1780058708833525bhmtn9do')}
                              </Typography>
                              <Typography variant="body" color="grey600">
                                {intlFormatNumber(grandTotal, { currency })}
                              </Typography>
                            </div>
                          </div>
                        )
                      }}
                    </form.Subscribe>
                  </div>
                )
              }}
            </form.Field>
          </div>
        </div>
      </div>
    )
  },
})

export default AddOnSelectionContent
