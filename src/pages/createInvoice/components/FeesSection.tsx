import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { AmountInput, ComboBox, ComboboxItem, TextInput } from '~/components/form'
import { useEditFeeBillingPeriodDialog } from '~/components/invoices/EditFeeBillingPeriod'
import { useEditInvoiceItemDescriptionDialog } from '~/components/invoices/EditInvoiceItemDescriptionDialog'
import { useEditInvoiceItemTaxDialog } from '~/components/invoices/EditInvoiceItemTaxDialog'
import { LocalFeeInput } from '~/components/invoices/types'
import { useEditInvoiceDisplayNameDialog } from '~/components/invoices/useEditInvoiceDisplayName'
import {
  ADD_ITEM_FOR_INVOICE_INPUT_NAME,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  AddOnForInvoiceEditTaxDialogFragmentDoc,
  CurrencyEnum,
  FetchDraftInvoiceTaxesMutation,
  TaxInfosForCreateInvoiceFragment,
  TaxInfosForCreateInvoiceFragmentDoc,
  useGetAddonListForInfoiceLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { invoiceFormErrorLabels } from '~/pages/createInvoice/formInitialization/validationSchema'
import { emptyInvoiceFormDefaultValues } from '~/pages/createInvoice/mappers/mapFromApiToForm'
import { MenuPopper } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  query getAddonListForInfoice($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        description
        amountCents
        amountCurrency
        invoiceDisplayName
        ...AddOnForInvoiceEditTaxDialog
        taxes {
          id
          ...TaxInfosForCreateInvoice
        }
      }
    }
  }

  ${TaxInfosForCreateInvoiceFragmentDoc}
  ${AddOnForInvoiceEditTaxDialogFragmentDoc}
`

export const FEES_SECTION_ITEM_TEST_ID = 'invoice-item'
export const FEES_SECTION_ITEM_ACTIONS_BUTTON_TEST_ID = 'invoice-item-actions-button'
export const FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID = 'add-item-button'
export const FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID = 'fees-section-at-least-one-fee-error'

const gridClassname =
  'grid  grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,168px)_minmax(0,64px)_minmax(0,160px)_minmax(0,24px)] gap-3 [&>*:nth-last-child(-n+3)]:flex [&>*:nth-last-child(-n+3)]:justify-end'

type FeesSectionProps = {
  hasTaxProvider: boolean
  customerApplicableTax: TaxInfosForCreateInvoiceFragment[] | undefined
  taxProviderTaxesResult: FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes']
  setTaxProviderTaxesResult: (
    result: FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes'],
  ) => void
  loading: boolean
}

const defaultProps: FeesSectionProps = {
  hasTaxProvider: false,
  customerApplicableTax: undefined,
  taxProviderTaxesResult: null,
  setTaxProviderTaxesResult: () => undefined,
  loading: false,
}

export const FeesSection = withForm({
  defaultValues: emptyInvoiceFormDefaultValues(),
  props: defaultProps,
  render: function FeesSectionRender({
    form,
    hasTaxProvider,
    customerApplicableTax,
    taxProviderTaxesResult,
    setTaxProviderTaxesResult,
    loading,
  }) {
    const { translate } = useInternationalization()
    const [showAddItem, setShowAddItem] = useState(false)

    const { openEditInvoiceItemDescriptionDialog } = useEditInvoiceItemDescriptionDialog()
    const { openEditInvoiceItemTaxDialog } = useEditInvoiceItemTaxDialog()
    const { openEditInvoiceDisplayNameDialog } = useEditInvoiceDisplayNameDialog()
    const { openEditFeeBillingPeriodDialog } = useEditFeeBillingPeriodDialog()

    const [getAddOns, { data: addOnData }] = useGetAddonListForInfoiceLazyQuery({
      variables: { limit: 20 },
    })

    const currencyValue = useStore(form.store, (state) => state.values.currency)
    const currency = currencyValue || CurrencyEnum.Usd

    // Validator-produced errors live DIRECTLY on errorMap.onDynamic, keyed by
    // field path (the `.fields` sub-shape only exists for manual setErrorMap).
    const dynamicFieldErrors = useStore(
      form.store,
      (state) => (state.errorMap as { onDynamic?: Record<string, unknown> })?.onDynamic ?? {},
    )

    const feesIssues = dynamicFieldErrors['fees'] as { message?: string }[] | undefined
    const atLeastOneFeeError =
      feesIssues?.[0]?.message === invoiceFormErrorLabels.atLeastOneFee
        ? feesIssues[0].message
        : undefined

    const addOns = useMemo(() => {
      if (!addOnData || !addOnData?.addOns || !addOnData?.addOns?.collection) return []

      return addOnData?.addOns?.collection.map(({ id, name, amountCents, amountCurrency }) => {
        return {
          label: name,
          labelNode: (
            <ComboboxItem>
              <Typography variant="body" color="grey700" noWrap>
                {name}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {intlFormatNumber(deserializeAmount(amountCents, amountCurrency) || 0, {
                  currencyDisplay: 'symbol',
                  currency: amountCurrency,
                })}
              </Typography>
            </ComboboxItem>
          ),
          value: id,
        }
      })
    }, [addOnData])

    return (
      <div className="w-full">
        <div className={tw(gridClassname, 'h-12 shadow-b [&>*]:flex [&>*]:items-center')}>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_6453819268763979024ad071')}
          </Typography>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_6453819268763979024ad07d')}
          </Typography>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_6453819268763979024ad089')}
          </Typography>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_636bedf292786b19d3398f06')}
          </Typography>
          <Typography variant="bodyHl" color="grey500">
            {translate('text_6453819268763979024ad097')}
          </Typography>
          {/* Action column */}
          <div></div>
        </div>
        <form.AppField name="fees" mode="array">
          {(feesField) => (
            <>
              {!!feesField.state.value?.length &&
                feesField.state.value?.map((fee, i) => {
                  const unitsIssues = dynamicFieldErrors[`fees[${i}].units`] as
                    { message?: string }[] | undefined
                  // Only the min-1 message ever displayed on the old form —
                  // the required error was message-less and never rendered.
                  const unitValidationErrorKey =
                    unitsIssues?.[0]?.message === invoiceFormErrorLabels.feeUnitsBelowOne
                      ? unitsIssues[0].message
                      : undefined

                  // Compute tax display content
                  let taxDisplayContent

                  if (hasTaxProvider) {
                    const hasTaxProviderResult = !!taxProviderTaxesResult?.collection.length

                    if (hasTaxProviderResult) {
                      const taxItem = taxProviderTaxesResult?.collection.find(
                        (t) => t.itemId === fee.addOnId,
                      )

                      taxDisplayContent = taxItem?.taxBreakdown?.map((tax) => (
                        <Typography
                          key={`fee-${i}-applied-taxe-${tax.name}`}
                          variant="body"
                          color="grey700"
                        >
                          {intlFormatNumber(tax?.rate || 0, {
                            style: 'percent',
                          })}
                        </Typography>
                      ))
                    } else {
                      taxDisplayContent = '-'
                    }
                  } else {
                    if (fee.taxes?.length) {
                      taxDisplayContent = fee.taxes.map((tax) => (
                        <Typography
                          key={`fee-${i}-applied-taxe-${tax.id}`}
                          variant="body"
                          color="grey700"
                        >
                          {intlFormatNumber(tax.rate / 100 || 0, {
                            style: 'percent',
                          })}
                        </Typography>
                      ))
                    } else {
                      taxDisplayContent = '0%'
                    }
                  }

                  return (
                    <div
                      className={tw(gridClassname, 'min-h-17 items-center py-3 shadow-b')}
                      key={`item-${i}`}
                      data-test={FEES_SECTION_ITEM_TEST_ID}
                    >
                      <div>
                        <Typography variant="captionHl" color="grey600" noWrap>
                          {translate('text_633dae57ca9a923dd53c2097', {
                            fromDate: intlFormatDateTime(fee.fromDatetime).date,
                            toDate: intlFormatDateTime(fee.toDatetime).date,
                          })}
                        </Typography>

                        <div className="flex items-center gap-2">
                          <Typography variant="body" color="grey700" noWrap>
                            {fee.invoiceDisplayName || fee.name}
                          </Typography>
                          <Tooltip
                            title={translate('text_65018c8e5c6b626f030bcf8d')}
                            placement="top-end"
                          >
                            <Button
                              icon="pen"
                              variant="quaternary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()

                                openEditInvoiceDisplayNameDialog({
                                  invoiceDisplayName: fee.invoiceDisplayName,
                                  callback: (invoiceDisplayName: string) => {
                                    form.setFieldValue(
                                      `fees[${i}].invoiceDisplayName`,
                                      invoiceDisplayName,
                                    )
                                  },
                                })
                              }}
                            />
                          </Tooltip>
                        </div>
                        {!!fee.description && (
                          <Typography variant="caption" color="grey600" noWrap>
                            {fee.description}
                          </Typography>
                        )}
                      </div>
                      <Tooltip
                        placement="top-end"
                        title={!!unitValidationErrorKey && translate(`${unitValidationErrorKey}`)}
                        disableHoverListener={!unitValidationErrorKey}
                      >
                        <TextInput
                          name={`fees.${i}.units`}
                          type="number"
                          beforeChangeFormatter={['triDecimal', 'positiveNumber']}
                          error={false}
                          placeholder={translate('text_62824f0e5d93bc008d268d00')}
                          value={fee.units || undefined}
                          onChange={(value) => {
                            form.setFieldValue(`fees[${i}].units`, Number(value))
                            !!hasTaxProvider && setTaxProviderTaxesResult(null)
                          }}
                        />
                      </Tooltip>
                      <AmountInput
                        beforeChangeFormatter={['positiveNumber']}
                        value={fee.unitAmountCents || 0}
                        currency={currency}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {getCurrencySymbol(currency)}
                            </InputAdornment>
                          ),
                        }}
                        onChange={(value) => {
                          form.setFieldValue(`fees[${i}].unitAmountCents`, value)
                          !!hasTaxProvider && setTaxProviderTaxesResult(null)
                        }}
                      />
                      <Typography
                        className="flex flex-col items-end py-1"
                        variant="body"
                        color="grey700"
                      >
                        {taxDisplayContent}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {!fee.units
                          ? '-'
                          : intlFormatNumber((fee.units || 0) * (fee.unitAmountCents || 0), {
                              style: 'currency',
                              currency,
                            })}
                      </Typography>
                      <Popper
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={() => (
                          <Button
                            icon="dots-horizontal"
                            variant="quaternary"
                            size="small"
                            data-test={FEES_SECTION_ITEM_ACTIONS_BUTTON_TEST_ID}
                          />
                        )}
                      >
                        {({ closePopper }) => (
                          <MenuPopper>
                            <Button
                              startIcon="calendar"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                openEditFeeBillingPeriodDialog({
                                  fromDatetime: fee.fromDatetime,
                                  toDatetime: fee.toDatetime,
                                  callback: (fromDatetime: string, toDatetime: string) => {
                                    // whole-array set: both dates land in one atomic
                                    // update, from a fresh callback-time read
                                    form.setFieldValue(
                                      'fees',
                                      form.state.values.fees.map((f, j) =>
                                        j === i ? { ...f, fromDatetime, toDatetime } : f,
                                      ),
                                    )
                                  },
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_1754596347194200100004000')}
                            </Button>
                            <Button
                              startIcon="text"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                openEditInvoiceItemDescriptionDialog({
                                  description: fee.description || '',
                                  callback: (newDescription?: string) => {
                                    form.setFieldValue(`fees[${i}].description`, newDescription)
                                  },
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_6453819268763979024ad124')}
                            </Button>
                            {!hasTaxProvider && (
                              <Button
                                startIcon="percentage"
                                variant="quaternary"
                                align="left"
                                onClick={() => {
                                  openEditInvoiceItemTaxDialog({
                                    taxes: fee.taxes,
                                    callback: (newTaxesArray?: LocalFeeInput['taxes']) => {
                                      form.setFieldValue(`fees[${i}].taxes`, newTaxesArray)
                                    },
                                  })
                                  closePopper()
                                }}
                                data-test="invoice-item-edit-taxes"
                              >
                                {translate('text_64d40b7e80e64e40710a49ba')}
                              </Button>
                            )}
                            <Button
                              startIcon="trash"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                feesField.removeValue(i)
                                !!hasTaxProvider && setTaxProviderTaxesResult(null)

                                closePopper()
                              }}
                            >
                              {translate('text_6453819268763979024ad12c')}
                            </Button>
                          </MenuPopper>
                        )}
                      </Popper>
                    </div>
                  )
                })}
              <div className="mt-6">
                {showAddItem ? (
                  <div className="flex items-center gap-3">
                    <ComboBox
                      containerClassName="flex-1"
                      className={ADD_ITEM_FOR_INVOICE_INPUT_NAME}
                      data={addOns}
                      loading={loading}
                      searchQuery={getAddOns}
                      placeholder={translate('text_6453819268763979024ad0ad')}
                      onChange={(value) => {
                        const addOn = addOnData?.addOns?.collection.find((c) => c.id === value)
                        const today = DateTime.now()
                        const addonApplicableTaxes = () => {
                          if (hasTaxProvider) return undefined
                          if (!!addOn?.taxes?.length) return addOn?.taxes
                          return customerApplicableTax
                        }

                        if (!!addOn) {
                          feesField.pushValue({
                            addOnId: addOn.id,
                            name: addOn.name,
                            description: addOn.description,
                            invoiceDisplayName: addOn.invoiceDisplayName || '',
                            units: 1,
                            unitAmountCents: deserializeAmount(addOn.amountCents, currency),
                            taxes: addonApplicableTaxes(),
                            fromDatetime: today.startOf('day').toISO(),
                            toDatetime: today.endOf('day').toISO(),
                          })

                          !!hasTaxProvider && setTaxProviderTaxesResult(null)
                        }

                        setShowAddItem(false)
                      }}
                    />
                    <Tooltip title={translate('text_628b8c693e464200e00e4a10')} placement="top-end">
                      <Button
                        icon="trash"
                        variant="quaternary"
                        size="small"
                        onClick={() => setShowAddItem(false)}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    variant="inline"
                    startIcon="plus"
                    onClick={() => {
                      setShowAddItem(true)
                      setTimeout(() => {
                        ;(
                          document.querySelector(
                            `.${ADD_ITEM_FOR_INVOICE_INPUT_NAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                          ) as HTMLElement
                        ).click()
                      }, 0)
                    }}
                    data-test={FEES_SECTION_ADD_ITEM_BUTTON_TEST_ID}
                  >
                    {translate('text_6453819268763979024ad0d7')}
                  </Button>
                )}
                {!!atLeastOneFeeError && (
                  <Typography
                    className="mt-1"
                    variant="caption"
                    color="danger600"
                    data-test={FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID}
                  >
                    {translate(atLeastOneFeeError)}
                  </Typography>
                )}
              </div>
            </>
          )}
        </form.AppField>
      </div>
    )
  },
})
