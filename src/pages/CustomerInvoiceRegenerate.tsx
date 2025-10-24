import { gql } from '@apollo/client'
import { Alert, Button, GenericPlaceholder, Typography } from 'lago-design-system'
import { useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import {
  DeleteAdjustedFeeDialog,
  DeleteAdjustedFeeDialogRef,
} from '~/components/invoices/details/DeleteAdjustedFeeDialog'
import { EditFeeDrawer, EditFeeDrawerRef } from '~/components/invoices/details/EditFeeDrawer'
import { InvoiceDetailsTable } from '~/components/invoices/details/InvoiceDetailsTable'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { LocalTaxProviderErrorsEnum } from '~/core/constants/form'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  Charge,
  CurrencyEnum,
  Customer,
  Fee,
  FeeAmountDetails,
  FeeAppliedTax,
  FetchDraftInvoiceTaxesMutation,
  Invoice,
  LagoApiError,
  useFetchDraftInvoiceTaxesMutation,
  useGetCustomerQuery,
  useGetInvoiceDetailsQuery,
  useGetInvoiceFeesQuery,
  useGetInvoiceSubscriptionsQuery,
  usePreviewAdjustedFeeMutation,
  useRegenerateInvoiceMutation,
  useVoidInvoiceMutation,
  VoidedInvoiceFeeInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { InvoiceQuickInfo } from '~/pages/InvoiceOverview'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

gql`
  fragment FeeForCustomerInvoiceRegenerate on Fee {
    id
    appliedTaxes {
      id
      taxCode
    }
  }

  mutation regenerateInvoice($input: RegenerateInvoiceInput!) {
    regenerateFromVoided(input: $input) {
      id
    }
  }

  mutation previewAdjustedFee($input: PreviewAdjustedFeeInput!) {
    previewAdjustedFee(input: $input) {
      id
      feeType
      amountCents
      invoiceName
      invoiceDisplayName
      units
      groupedBy
      preciseUnitAmount
      addOn {
        id
      }
      appliedTaxes {
        id
        amountCents
        taxRate
        taxName
      }
      amountDetails {
        freeUnits
        paidUnits
        perPackageSize
        perPackageUnitAmount
        graduatedRanges {
          flatUnitAmount
          fromValue
          perUnitAmount
          toValue
          units
          perUnitTotalAmount
        }
        graduatedPercentageRanges {
          flatUnitAmount
          fromValue
          rate
          toValue
          units
          perUnitTotalAmount
        }
      }
      charge {
        id
        payInAdvance
        minAmountCents
        chargeModel
        billableMetric {
          id
          name
        }
      }
      chargeFilter {
        id
        invoiceDisplayName
        values
      }
      subscription {
        id
        plan {
          id
          interval
          name
        }
      }
    }
  }
`

export type OnRegeneratedFeeAdd = (input: {
  feeId?: string | null
  unitPreciseAmount?: string | null
  invoiceDisplayName?: string | null
  units?: number | null
  amountDetails?: FeeAmountDetails | null
  charge?: Charge | null
  chargeFilterId?: string | null
  invoiceSubscriptionId?: string | null
}) => void

const removeEmptyKeys = (obj: object) => {
  const keys = Object.keys(obj).filter((key) => !!obj[key as keyof typeof obj])

  return Object.fromEntries(keys.map((key) => [key, obj[key as keyof typeof obj]]))
}

const invoiceFeesToNonAdjusted = (invoice?: Invoice | null) => {
  return {
    ...invoice,
    fees: invoice?.fees?.map((fee) => ({
      ...fee,
      adjustedFee: false,
    })),
    invoiceSubscriptions: invoice?.invoiceSubscriptions?.map((subscription) => ({
      ...subscription,
      fees: subscription?.fees?.map((fee) => ({
        ...fee,
        adjustedFee: false,
      })),
    })),
  }
}

const TEMPORARY_ID_PREFIX = 'temporary-id-fee-'

const CustomerInvoiceRegenerate = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { customerId, invoiceId } = useParams()
  const navigate = useNavigate()

  const deleteAdjustedFeeDialogRef = useRef<DeleteAdjustedFeeDialogRef>(null)
  const editFeeDrawerRef = useRef<EditFeeDrawerRef>(null)

  const { data, loading, error } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const { data: fullCustomer } = useGetCustomerQuery({
    variables: {
      id: data?.invoice?.customer?.id as string,
    },
    skip: !data?.invoice?.customer?.id,
  })

  const { data: fullFeesInvoice } = useGetInvoiceFeesQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const { data: fullInvoiceSubscriptionsRaw } = useGetInvoiceSubscriptionsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const fullFees = fullFeesInvoice?.invoice?.fees
  const fullInvoiceSubscriptions = fullInvoiceSubscriptionsRaw?.invoice?.invoiceSubscriptions

  const invoice = invoiceFeesToNonAdjusted(data?.invoice as Invoice)
  const customer = invoice?.customer
  const billingEntity = invoice?.billingEntity
  const hasTaxProvider =
    !!fullCustomer?.customer?.anrokCustomer?.id || !!fullCustomer?.customer?.avalaraCustomer?.id

  const [fees, setFees] = useState(invoice?.fees || [])
  const [taxProviderTaxesResult, setTaxProviderTaxesResult] =
    useState<FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes']>(null)
  const [taxProviderTaxesErrorMessage, setTaxProviderTaxesErrorMessage] =
    useState<LocalTaxProviderErrorsEnum | null>()

  const [regenerateInvoice] = useRegenerateInvoiceMutation({
    onCompleted(regeneratedData) {
      if (regeneratedData?.regenerateFromVoided?.id && customerId && invoiceId) {
        addToast({
          message: translate('text_17512809059243nam2ohm0ul'),
          severity: 'success',
        })

        navigate(
          generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
            customerId,
            invoiceId: regeneratedData?.regenerateFromVoided?.id || invoiceId,
            tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
          }),
        )
      }
    },
  })

  const [getTaxFromTaxProvider] = useFetchDraftInvoiceTaxesMutation({
    fetchPolicy: 'no-cache',
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
  })

  const [voidInvoice] = useVoidInvoiceMutation()
  const [previewAdjustedFee] = usePreviewAdjustedFeeMutation()

  const onAdd: OnRegeneratedFeeAdd = async (input) => {
    const previewedFee = await previewAdjustedFee({
      variables: {
        input: {
          invoiceId: invoiceId as string,
          ...removeEmptyKeys({
            feeId: input?.feeId,
            units: input?.units,
            unitPreciseAmount: input?.unitPreciseAmount,
            invoiceSubscriptionId: input?.invoiceSubscriptionId,
            chargeId: input?.charge?.id,
            chargeFilterId: input?.chargeFilterId,
            invoiceDisplayName: input?.invoiceDisplayName,
          }),
        },
      },
    })

    const feeData = previewedFee?.data?.previewAdjustedFee

    const isUpdate = fees?.find((f) => f.id === input?.feeId)

    const calculatedFee = {
      ...feeData,
      id: isUpdate ? input?.feeId : `${TEMPORARY_ID_PREFIX}-${Math.random().toString()}`,
      adjustedFee: true,
      wasOnlyUnitsUpdate: typeof input?.unitPreciseAmount === 'undefined',
    } as Fee & {
      wasOnlyUnitsUpdate: boolean
    }

    if (isUpdate) {
      return setFees((f) => f.map((fee) => (fee.id === input.feeId ? calculatedFee : fee)))
    }

    return setFees((f) => [...f, calculatedFee])
  }

  const onDelete = (id: string) => {
    const original = invoice?.fees?.find((f) => f.id === id)

    if (original) {
      return setFees((f) => f.map((fee) => (fee.id === id ? original : fee)))
    }

    return setFees((f) => f.filter((fee) => fee.id !== id))
  }

  const onSubmit = async () => {
    if (!invoiceId) {
      return
    }

    if (!invoice?.voidedAt) {
      await voidInvoice({
        variables: {
          input: {
            id: invoiceId,
            generateCreditNote: false,
          },
        },
      })
    }

    const feesInput: VoidedInvoiceFeeInput[] = fees
      .map((fee) => ({
        id: fee.id.includes(TEMPORARY_ID_PREFIX) ? null : fee.id,
        addOnId: fee?.addOn?.id,
        chargeId: fee?.charge?.id,
        chargeFilterId: fee?.chargeFilter?.id,
        description: fee?.description,
        invoiceDisplayName: fee?.invoiceDisplayName,
        subscriptionId: fee?.subscription?.id,
        unitAmountCents: (fee as { wasOnlyUnitsUpdate?: boolean })?.wasOnlyUnitsUpdate
          ? null
          : fee?.preciseUnitAmount,
        units: fee?.units,
      }))
      .map((fee) => removeEmptyKeys(fee))

    await regenerateInvoice({
      variables: {
        input: {
          voidedInvoiceId: invoiceId,
          fees: feesInput,
        },
      },
    })
  }

  const onClose = () => {
    if (customerId && invoiceId) {
      goBack(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId,
          invoiceId,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
      )
    }
  }

  const getFormattedDate = (date: string): string => {
    if (!date) return '-'

    return intlFormatDateTime(date, {
      timezone: customer?.applicableTimezone,
    }).date
  }

  if (error) {
    return (
      <GenericPlaceholder
        className="pt-12"
        title={translate('text_634812d6f16b31ce5cbf4126')}
        subtitle={translate('text_634812d6f16b31ce5cbf4128')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography className="font-medium text-grey-700">
          {translate(
            !!invoice?.voidedAt ? 'text_1750678506388s7bfu2qjzhn' : 'text_17519912068281q4wys5q1g2',
          )}
        </Typography>

        <Button variant="quaternary" icon="close" onClick={() => onClose()} />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="customer-invoice-regenerate" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <>
          <CenteredPage.Container className="pb-12">
            <div className="flex flex-col gap-12">
              <Alert type="info">
                <Typography className="text-grey-700">
                  {!!invoice?.voidedAt
                    ? translate('text_17506785063887oto6r0hcq0', {
                        invoiceNumber: invoice?.number,
                        issuingDate: getFormattedDate(invoice?.issuingDate),
                        voidDate: getFormattedDate(invoice?.voidedAt),
                      })
                    : translate('text_1751991206828m0rxpmddapo', {
                        invoiceNumber: invoice?.number,
                        issuingDate: getFormattedDate(invoice?.issuingDate),
                      })}
                </Typography>
              </Alert>
              <div className="flex flex-col gap-1">
                <Typography className="text-2xl font-semibold text-grey-700">
                  {translate(
                    !!invoice?.voidedAt
                      ? 'text_1750678506388s7bfu2qjzhn'
                      : 'text_17519912068281q4wys5q1g2',
                  )}
                </Typography>

                <Typography className="text-grey-600">
                  {translate(
                    !!invoice?.voidedAt
                      ? 'text_1750678506388d8u5rv893gn'
                      : 'text_17519914705750hjw95snsdf',
                  )}
                </Typography>
              </div>
            </div>
          </CenteredPage.Container>

          <div className="px-40">
            {invoice && customer && billingEntity && (
              <InvoiceQuickInfo
                customer={customer}
                invoice={invoice as Invoice}
                billingEntity={billingEntity}
              />
            )}
            <InvoiceDetailsTable
              customer={customer as Customer}
              invoice={invoice as Invoice}
              editFeeDrawerRef={editFeeDrawerRef}
              deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
              isDraftOverride={true}
              onAdd={onAdd}
              onDelete={onDelete}
              fees={fees}
              invoiceSubscriptions={fullInvoiceSubscriptions}
            />
          </div>
        </>
      )}

      <CenteredPage.Container>
        {!!taxProviderTaxesErrorMessage && (
          <Alert type="warning">
            <Typography variant="bodyHl" color="grey700">
              {translate('text_1723831735547ttel1jl0yva')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate(taxProviderTaxesErrorMessage)}
            </Typography>
          </Alert>
        )}
      </CenteredPage.Container>

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" size="large" onClick={() => onClose()}>
          {translate('text_6411e6b530cb47007488b027')}
        </Button>

        {!!hasTaxProvider && (
          <Button
            size="large"
            variant="secondary"
            disabled={!!taxProviderTaxesResult}
            onClick={async () => {
              setTaxProviderTaxesErrorMessage(null)

              const taxProviderResult = await getTaxFromTaxProvider({
                variables: {
                  input: {
                    currency: invoice?.currency,
                    customerId: customer?.id as string,
                    fees: fees.map((f) => ({
                      addOnId: f.id,
                      description: f.description,
                      invoiceDisplayName: f.invoiceDisplayName,
                      name: f.itemName,
                      taxCodes: fullFees
                        ?.find((x) => x.id === f.id)
                        ?.appliedTaxes?.map((t) => t.taxCode) || [''],
                      unitAmountCents: String(
                        serializeAmount(f.preciseUnitAmount, invoice?.currency || CurrencyEnum.Usd),
                      ),
                      units: f.units,
                      fromDatetime: f.properties?.fromDatetime,
                      toDatetime: f.properties?.toDatetime,
                    })),
                  },
                },
              })

              const { data: taxProviderResultData, errors } = taxProviderResult

              if (!!errors?.length) {
                if (
                  // Anrok
                  hasDefinedGQLError('CurrencyCodeNotSupported', errors) ||
                  // Avalara
                  hasDefinedGQLError('InvalidEnumValue', errors)
                ) {
                  setTaxProviderTaxesErrorMessage(
                    LocalTaxProviderErrorsEnum.CurrencyCodeNotSupported,
                  )
                } else if (
                  // Anrok
                  hasDefinedGQLError('CustomerAddressCountryNotSupported', errors) ||
                  hasDefinedGQLError('CustomerAddressCouldNotResolve', errors) ||
                  // Avalara
                  hasDefinedGQLError('MissingAddress', errors) ||
                  hasDefinedGQLError('NotEnoughAddressesInfo', errors) ||
                  hasDefinedGQLError('InvalidAddress', errors) ||
                  hasDefinedGQLError('InvalidPostalCode', errors) ||
                  hasDefinedGQLError('AddressLocationNotFound', errors)
                ) {
                  setTaxProviderTaxesErrorMessage(LocalTaxProviderErrorsEnum.CustomerAddressError)
                } else if (
                  // Anrok
                  hasDefinedGQLError('ProductExternalIdUnknown', errors) ||
                  // Avalara
                  hasDefinedGQLError('TaxCodeAssociatedWithItemCodeNotFound', errors) ||
                  hasDefinedGQLError('EntityNotFoundError', errors)
                ) {
                  setTaxProviderTaxesErrorMessage(
                    LocalTaxProviderErrorsEnum.ProductExternalIdUnknown,
                  )
                } else {
                  setTaxProviderTaxesErrorMessage(LocalTaxProviderErrorsEnum.GenericErrorMessage)
                }

                // Scroll bottom of the screen once the error message is displayed
                setTimeout(() => {
                  const rootElement = document.getElementById('root')

                  rootElement?.scrollTo({
                    top: rootElement.scrollHeight,
                    behavior: 'smooth',
                  })
                }, 1)

                return
              }

              const taxes = taxProviderResultData?.fetchDraftInvoiceTaxes?.collection

              setFees((_fees) =>
                _fees.map((f) => {
                  const tax = taxes?.find((t) => t.itemId === f.id)

                  if (!tax) {
                    return f
                  }

                  const newFee = {
                    ...f,
                    appliedTaxes: [
                      ...(tax.taxBreakdown || []).map(
                        (breakdown) =>
                          ({
                            id: Math.random().toString(),
                            taxRate: (breakdown.rate || 0) * 100,
                            taxName: breakdown.name,
                            amountCents: breakdown.taxAmount,
                          }) as FeeAppliedTax,
                      ),
                    ],
                  }

                  return newFee
                }),
              )

              setTaxProviderTaxesResult(taxProviderResultData?.fetchDraftInvoiceTaxes)
            }}
          >
            {translate('text_172383173554743nq9isxpje')}
          </Button>
        )}

        <Button variant="primary" size="large" onClick={() => onSubmit()}>
          {translate(
            !!invoice?.voidedAt ? 'text_1750678506388ssxh1yacay0' : 'text_1751991518313o0xwbo9xf0y',
          )}
        </Button>
      </CenteredPage.StickyFooter>

      <DeleteAdjustedFeeDialog ref={deleteAdjustedFeeDialogRef} />
      <EditFeeDrawer ref={editFeeDrawerRef} />
    </CenteredPage.Wrapper>
  )
}

export default CustomerInvoiceRegenerate
