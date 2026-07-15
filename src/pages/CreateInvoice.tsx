import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useCallback, useMemo, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import { Alert } from '~/components/designSystem/Alert'
import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Card } from '~/components/designSystem/Card'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { InvoiceTaxesDisplay, TaxMapType } from '~/components/invoices/InvoiceTaxesDisplay'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import { PaymentMethodsForm, ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import { PO } from '~/components/purchaseOrder/PO'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  appliedTaxEnumedTaxCodeTranslationKey,
  LocalTaxProviderErrorsEnum,
} from '~/core/constants/form'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { formatAddress } from '~/core/formats/formatAddress'
import { CUSTOMER_DETAILS_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import { formatInvoiceDisplayValue, invoiceFeesToFeeInput } from '~/core/utils/invoiceUtils'
import {
  CurrencyEnum,
  CustomerAccountTypeEnum,
  FeatureFlagEnum,
  FeeForInvoiceFeesToFeeInputFragmentDoc,
  FetchDraftInvoiceTaxesMutation,
  Invoice,
  LagoApiError,
  TaxInfosForCreateInvoiceFragment,
  useCreateInvoiceMutation,
  useFetchDraftInvoiceTaxesMutation,
  useGetBillingEntityQuery,
  useGetBillingEntityTaxesForCreateInvoiceQuery,
  useGetInfosForCreateInvoiceQuery,
  useVoidInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useBillingEntitiesOptions } from '~/hooks/useBillingEntitiesOptions'
import { useIframeConfig } from '~/hooks/useIframeConfig'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissionsInvoiceActions } from '~/hooks/usePermissionsInvoiceActions'
import { FeesSection } from '~/pages/createInvoice/components/FeesSection'
import { invoiceFormValidationSchema } from '~/pages/createInvoice/formInitialization/validationSchema'
import { mapFromApiToForm } from '~/pages/createInvoice/mappers/mapFromApiToForm'
import { mapFormToCreateInput } from '~/pages/createInvoice/mappers/mapFromFormToApi'
import { useInvoiceBuildRegenerationPreview } from '~/pages/invoiceDetails/common/useInvoiceBuildRegenerationPreview'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'
import { tw } from '~/styles/utils'

export const computeHasTaxProvider = (
  customer?: {
    anrokCustomer?: { id: string } | null
    avalaraCustomer?: { id: string } | null
  } | null,
): boolean => {
  return !!customer?.anrokCustomer?.id || !!customer?.avalaraCustomer?.id
}

export const resolveCustomerApplicableTax = ({
  hasTaxProvider,
  customerTaxes,
  billingEntityTaxes,
  orgTaxes,
}: {
  hasTaxProvider: boolean
  customerTaxes?: TaxInfosForCreateInvoiceFragment[] | null
  billingEntityTaxes?: TaxInfosForCreateInvoiceFragment[] | null
  orgTaxes?: TaxInfosForCreateInvoiceFragment[]
}): TaxInfosForCreateInvoiceFragment[] | undefined => {
  if (hasTaxProvider) return []
  if (!!customerTaxes?.length) return customerTaxes

  if (!!billingEntityTaxes?.length) return billingEntityTaxes

  return orgTaxes
}

gql`
  fragment TaxInfosForCreateInvoice on Tax {
    id
    name
    code
    rate
  }

  query getInfosForCreateInvoice($id: ID!) {
    customer(id: $id) {
      id
      externalId
      addressLine1
      addressLine2
      city
      country
      currency
      email
      name
      displayName
      legalName
      legalNumber
      taxIdentificationNumber
      state
      zipcode
      accountType
      billingEntity {
        id
        code
      }
      taxes {
        id
        ...TaxInfosForCreateInvoice
      }
      anrokCustomer {
        id
      }
      avalaraCustomer {
        id
      }
    }

    taxes(page: 1, limit: 1000, appliedToOrganization: true) {
      collection {
        id
        ...TaxInfosForCreateInvoice
      }
    }
  }

  query getBillingEntityTaxesForCreateInvoice($billingEntityId: ID!) {
    billingEntityTaxes(billingEntityId: $billingEntityId) {
      collection {
        id
        ...TaxInfosForCreateInvoice
      }
    }
  }

  mutation fetchDraftInvoiceTaxes($input: FetchDraftInvoiceTaxesInput!) {
    fetchDraftInvoiceTaxes(input: $input) {
      collection {
        amountCents
        itemId # used to match addon-fee and tax provider data
        taxAmountCents
        taxBreakdown {
          name
          rate
          taxAmount
          enumedTaxCode
        }
      }
    }
  }

  mutation createInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
    }
  }

  ${FeeForInvoiceFeesToFeeInputFragmentDoc}
`

const CreateInvoice = () => {
  const { translate } = useInternationalization()
  const { customerId, voidedInvoiceId = '' } = useParams()
  const navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const actions = usePermissionsInvoiceActions()
  const { hasFeatureFlag } = useOrganizationInfos()
  const {
    emitIframeMessage,
    emitSalesForceEvent,
    isRunningInIframeContext,
    isRunningInSalesForceIframe,
  } = useIframeConfig()

  const [taxProviderTaxesResult, setTaxProviderTaxesResult] =
    useState<FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes']>(null)
  const [taxProviderTaxesErrorMessage, setTaxProviderTaxesErrorMessage] =
    useState<LocalTaxProviderErrorsEnum | null>(null)

  const centralizedDialog = useCentralizedDialog()

  const handleClosePage = useCallback(() => {
    goBack(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
  }, [goBack, customerId])

  const { data, loading, error } = useGetInfosForCreateInvoiceQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
  })
  const { customer, taxes } = data || {}

  const { invoiceBuildRegenerationPreview: prefillInvoice, loading: prefillInvoiceLoading } =
    useInvoiceBuildRegenerationPreview(voidedInvoiceId)

  const prefillFees = useMemo(() => {
    const fees = prefillInvoice?.fees

    if (!fees) {
      return
    }

    return invoiceFeesToFeeInput(prefillInvoice as Invoice) ?? undefined
  }, [prefillInvoice])

  const { options: billingEntityOptions } = useBillingEntitiesOptions()
  const [pickedBillingEntityId, setPickedBillingEntityId] = useState<string | undefined>(undefined)
  const activeBillingEntityCode =
    billingEntityOptions.find((o) => o.id === pickedBillingEntityId)?.value ??
    customer?.billingEntity?.code

  const { data: billingEntityData } = useGetBillingEntityQuery({
    variables: {
      code: activeBillingEntityCode as string,
    },
    skip: !activeBillingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  const { data: billingEntityTaxesData } = useGetBillingEntityTaxesForCreateInvoiceQuery({
    variables: {
      billingEntityId: billingEntity?.id as string,
    },
    skip: !billingEntity?.id,
  })

  const hasTaxProvider = computeHasTaxProvider(customer)
  const customerName = customer?.displayName
  const customerIsPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  const formattedBillingAddress = formatAddress({
    addressLine1: billingEntity?.addressLine1,
    addressLine2: billingEntity?.addressLine2,
    city: billingEntity?.city,
    country: billingEntity?.country,
    state: billingEntity?.state,
    zipcode: billingEntity?.zipcode,
  })

  const formattedCustomerAddress = formatAddress({
    addressLine1: customer?.addressLine1,
    addressLine2: customer?.addressLine2,
    city: customer?.city,
    country: customer?.country,
    state: customer?.state,
    zipcode: customer?.zipcode,
  })

  const customerApplicableTax = useMemo(
    () =>
      resolveCustomerApplicableTax({
        hasTaxProvider,
        customerTaxes: customer?.taxes,
        billingEntityTaxes: billingEntityTaxesData?.billingEntityTaxes?.collection,
        orgTaxes: taxes?.collection,
      }),
    [
      billingEntityTaxesData?.billingEntityTaxes?.collection,
      customer?.taxes,
      hasTaxProvider,
      taxes?.collection,
    ],
  )

  const [getTaxFromTaxProvider] = useFetchDraftInvoiceTaxesMutation({
    fetchPolicy: 'no-cache',
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
  })

  const [createInvoice] = useCreateInvoiceMutation({
    onCompleted({ createInvoice: createInvoiceResult }) {
      if (!!createInvoiceResult?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_6453819268763979024ad144',
        })
        if (isRunningInSalesForceIframe) {
          emitSalesForceEvent({
            action: 'close',
            rel: 'create-invoice',
            invoiceId: createInvoiceResult.id,
          })
        } else if (isRunningInIframeContext) {
          emitIframeMessage({
            action: 'DONE',
            rel: 'create-invoice',
            invoiceId: createInvoiceResult.id,
          })
        } else {
          navigate(
            generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
              customerId: customerId as string,
              invoiceId: createInvoiceResult.id,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
            }),
          )
        }
      }
    },
  })

  const [voidInvoice] = useVoidInvoiceMutation({})

  const form = useAppForm({
    // Recomputed inline on every render: TanStack re-seeds an untouched form
    // when defaults deep-change, replacing Formik's enableReinitialize as the
    // customer/billing-entity/regeneration-preview queries resolve.
    defaultValues: mapFromApiToForm({
      customerId,
      customer,
      billingEntity,
      prefillInvoice,
      prefillFees,
    }),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: invoiceFormValidationSchema,
    },
    onSubmit: async ({ value }) => {
      if (voidedInvoiceId && prefillInvoice?.id && actions.canVoid(prefillInvoice)) {
        const res = await voidInvoice({
          variables: {
            input: {
              id: voidedInvoiceId,
              generateCreditNote: false,
            },
          },
        })

        if (!res.data?.voidInvoice?.id) {
          return
        }
      }

      await createInvoice({
        variables: {
          input: mapFormToCreateInput(value, {
            hasTaxProvider,
            prefillInvoiceId: prefillInvoice?.id,
          }),
        },
      })
    },
  })

  const formValues = useStore(form.store, (state) => state.values)
  const isDirty = useStore(form.store, (state) => state.isDirty)

  // Live validity for the tax-provider fetch gate — the old form validated on
  // mount/change, while revalidateLogic only populates errors from the first
  // submit attempt.
  const isFormValid = useMemo(
    () => invoiceFormValidationSchema.safeParse(formValues).success,
    [formValues],
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  const paymentMethodsFormAdapter: PaymentMethodsForm<ViewTypeEnum.OneOffInvoice> = {
    values: formValues,
    setFieldValue: (field, value) =>
      form.setFieldValue(field as Parameters<typeof form.setFieldValue>[0], value as never),
  }

  const currency = formValues.currency || CurrencyEnum.Usd
  const hasAnyFee = formValues.fees.length > 0

  // On the regenerate route the prefill must land BEFORE the user can touch
  // the form — TanStack only re-seeds untouched forms (unlike Formik's
  // reinitialize, which wiped user edits when the preview resolved).
  const isLoading = loading || (!!voidedInvoiceId && prefillInvoiceLoading && !prefillInvoice)

  const {
    subTotal,
    taxesToDisplay,
    total,
  }: { subTotal: number; taxesToDisplay: TaxMapType; total: number } = useMemo(() => {
    if (hasTaxProvider) {
      return { subTotal: 0, taxesToDisplay: new Map(), total: 0 }
    }

    const updateOrCreateTaxMap = (
      currentTaxesMap: TaxMapType,
      feeAmount?: number,
      feeUnits?: number,
      feeAppliedTaxes?: TaxInfosForCreateInvoiceFragment[],
    ) => {
      if (!feeAppliedTaxes?.length) return currentTaxesMap
      if (!currentTaxesMap) currentTaxesMap = new Map()

      feeAppliedTaxes.forEach((appliedTax) => {
        const { id, name, rate } = appliedTax
        const amount = ((Number(feeAmount) || 0) * Number(feeUnits || 0) * rate) / 100

        const previousTax = currentTaxesMap?.get(id)

        if (previousTax) {
          previousTax.amount += amount
          currentTaxesMap?.set(id, previousTax)
        } else {
          currentTaxesMap?.set(id, { amount, label: `${name} (${rate}%)`, taxRate: rate })
        }
      })

      return currentTaxesMap
    }

    const totalsReduced = formValues.fees.reduce(
      (acc, fee) => {
        acc = {
          subTotal: acc.subTotal + (fee?.units || 0) * (fee?.unitAmountCents || 0),
          taxesToDisplay: updateOrCreateTaxMap(
            acc.taxesToDisplay,
            fee.unitAmountCents,
            fee.units || 0,
            fee?.taxes || undefined,
          ),
        }
        return acc
      },
      { subTotal: 0, taxesToDisplay: new Map() },
    )

    const vatTotalAmount = totalsReduced?.taxesToDisplay?.size
      ? Array.from(totalsReduced?.taxesToDisplay.values()).reduce((acc, tax) => acc + tax.amount, 0)
      : 0
    const localTotal = totalsReduced.subTotal + vatTotalAmount

    return {
      subTotal: totalsReduced.subTotal,
      taxesToDisplay: totalsReduced.taxesToDisplay,
      total: localTotal,
    }
  }, [formValues.fees, hasTaxProvider])

  const {
    taxProviderTaxesToDisplay,
    taxProviderSubtotalHT,
    taxProviderTotalTTC,
  }: {
    taxProviderTaxesToDisplay: TaxMapType
    taxProviderSubtotalHT: number
    taxProviderTotalTTC: number
  } = useMemo(() => {
    if (!hasTaxProvider)
      return {
        taxProviderTaxesToDisplay: new Map(),
        taxProviderSubtotalHT: 0,
        taxProviderTotalTTC: 0,
      }

    const localTaxProviderTaxesToDisplay = !taxProviderTaxesResult?.collection?.length
      ? new Map()
      : taxProviderTaxesResult.collection.reduce((acc, cur) => {
          cur.taxBreakdown?.forEach((tax) => {
            const previousTax = acc.get(tax.rate)

            if (previousTax) {
              previousTax.amount += Number(tax.taxAmount || 0)
              acc.set(tax.rate, previousTax)
            } else {
              acc.set(tax.rate, {
                amount: Number(tax.taxAmount || 0),
                label: !!tax.enumedTaxCode
                  ? translate(appliedTaxEnumedTaxCodeTranslationKey[tax.enumedTaxCode])
                  : `${tax.name} (${!tax?.rate || tax?.rate === 0 ? 0 : tax.rate * 100}%)`,
                taxRate: (tax.rate || 0) * 100,
                hasEnumedTaxCode: !!tax.enumedTaxCode,
              })
            }
          })

          return acc
        }, new Map())

    const taxesTotalAmount = Array.from(localTaxProviderTaxesToDisplay.values()).reduce(
      (acc, tax) => acc + deserializeAmount(tax.amount, currency),
      0,
    )

    const localTaxProviderSubtotalHT =
      formValues.fees.reduce((acc, fee) => {
        acc += (fee.units || 0) * (fee.unitAmountCents || 0)
        return acc
      }, 0) || 0

    return {
      taxProviderTaxesToDisplay: localTaxProviderTaxesToDisplay,
      taxProviderSubtotalHT: localTaxProviderSubtotalHT,
      taxProviderTotalTTC: localTaxProviderSubtotalHT + taxesTotalAmount,
    }
  }, [currency, formValues.fees, hasTaxProvider, taxProviderTaxesResult?.collection, translate])

  const showBillingEntityPicker = hasFeatureFlag(FeatureFlagEnum.MultiEntityBilling)
  const hasMultiCurrency = hasFeatureFlag(FeatureFlagEnum.MultiCurrency)

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  const invoiceFooterLineClassname =
    'flex items-center [&>*:first-child]:mr-4 [&>*:first-child]:flex-1 [&>*:last-child]:w-42 [&>*:last-child]:text-end'

  const subtotalDisplayValue = formatInvoiceDisplayValue(
    hasTaxProvider,
    !!taxProviderSubtotalHT,
    taxProviderSubtotalHT,
    hasAnyFee,
    subTotal,
    currency,
  )

  const amountDueValue = formatInvoiceDisplayValue(
    hasTaxProvider,
    !!taxProviderTaxesToDisplay.size,
    taxProviderTotalTTC,
    hasAnyFee,
    total,
    currency,
  )

  return (
    <>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6453819268763979024acfe9')}
        </Typography>

        {!isRunningInSalesForceIframe && !isRunningInIframeContext && (
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              isDirty
                ? centralizedDialog.open({
                    title: translate('text_645388d5bdbd7b00abffa030'),
                    description: translate('text_645388d5bdbd7b00abffa031'),
                    actionText: translate('text_645388d5bdbd7b00abffa033'),
                    colorVariant: 'danger',
                    onAction: handleClosePage,
                  })
                : handleClosePage()
            }
          />
        )}
      </PageHeader.Wrapper>
      <form className="size-full" onSubmit={handleSubmit}>
        <div className="mx-auto my-12 min-h-full max-w-5xl px-4">
          <Card className="mb-12 gap-8">
            {isLoading ? (
              <>
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" className="w-30" />
                  <Skeleton className="rounded-lg" variant="connectorAvatar" size="big" />
                </div>
                <div>
                  <div className="flex items-center py-2">
                    <Skeleton variant="text" className="mr-13 w-26" />
                    <Skeleton variant="text" className="w-24" />
                  </div>
                  <div className="flex items-center py-2">
                    <Skeleton variant="text" className="mr-13 w-26" />
                    <Skeleton variant="text" className="w-24" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="mb-3 w-26" variant="text" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="mb-3 w-26" variant="text" />
                    <Skeleton className="w-26" variant="text" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Typography variant="headline" color="textSecondary">
                    {translate('text_6453819268763979024acff5')}
                  </Typography>
                  {!!billingEntity?.logoUrl && (
                    <Avatar size="big" variant="connector">
                      <img src={billingEntity?.logoUrl ?? undefined} alt="company-logo" />
                    </Avatar>
                  )}
                </div>

                {customerIsPartner && (
                  <Alert type="info">
                    <Typography variant="body" color="grey700">
                      {translate('text_1738593143437uebmu9jwtc4')}
                    </Typography>

                    <Typography variant="caption" color="grey600">
                      {translate('text_1738593143438173lt8105a5')}
                    </Typography>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-[200px_auto] items-baseline gap-4">
                    <Typography variant="caption" color="grey600">
                      {translate('text_6453819268763979024ad01b')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {intlFormatDateTime(DateTime.now().toISO()).date}
                    </Typography>
                  </div>

                  <PO
                    className="flex-row items-center gap-4"
                    value={formValues.purchaseOrderNumber}
                    onChange={(value) => {
                      form.setFieldValue('purchaseOrderNumber', value || undefined)
                    }}
                    description={translate('text_1782219771286e8qwitkefxr')}
                  >
                    <PO.Title className="min-w-[200px]" variant="caption" color="grey600" />

                    {formValues.purchaseOrderNumber ? (
                      <div className="flex items-center gap-2">
                        <PO.Number variant="body" color="grey700" />
                        <PO.EditButton />
                        <PO.TrashButton />
                      </div>
                    ) : (
                      <PO.AddButton>{translate('text_17822197712864tnvgq76xou')}</PO.AddButton>
                    )}
                  </PO>
                </div>

                <div className="flex flex-row items-start gap-4">
                  {showBillingEntityPicker && (
                    <div className="w-80">
                      <BillingEntityFormPicker
                        label={translate('text_1743611497157teaa1zu8l24')}
                        value={formValues.billingEntityId}
                        onChange={(id) => {
                          form.setFieldValue('billingEntityId', id)
                          setPickedBillingEntityId(id)
                        }}
                      />
                    </div>
                  )}
                  <div className="w-40">
                    <form.AppField name="currency">
                      {(field) => (
                        <field.ComboBoxField
                          disableClearable
                          data={Object.values(CurrencyEnum).map((currencyType) => ({
                            value: currencyType,
                          }))}
                          disabled={!!customer?.currency && !hasMultiCurrency}
                          label={translate('text_6453819268763979024ad057')}
                        />
                      )}
                    </form.AppField>
                  </div>
                </div>

                <div className={tw('flex gap-4', customerIsPartner && 'flex-row-reverse')}>
                  <div className="flex-1">
                    <Typography variant="caption" color="grey600">
                      {translate(
                        customerIsPartner
                          ? 'text_6453819268763979024ad03f'
                          : 'text_6453819268763979024ad027',
                      )}
                    </Typography>
                    <Typography variant="body" color="grey700" forceBreak>
                      {billingEntity?.legalName || billingEntity?.name}
                    </Typography>
                    {billingEntity?.legalNumber && (
                      <Typography variant="body" color="grey700">
                        {billingEntity?.legalNumber}
                      </Typography>
                    )}
                    {!!formattedBillingAddress && (
                      <Typography variant="body" color="grey700">
                        {formattedBillingAddress}
                      </Typography>
                    )}
                    {billingEntity?.email && (
                      <Typography variant="body" color="grey700">
                        {billingEntity?.email}
                      </Typography>
                    )}
                    {billingEntity?.taxIdentificationNumber && (
                      <Typography variant="body" color="grey700">
                        {translate('text_648053ee819b60364c675c78', {
                          taxIdentificationNumber: billingEntity.taxIdentificationNumber,
                        })}
                      </Typography>
                    )}
                  </div>
                  <div className="flex-1">
                    <Typography variant="caption" color="grey600">
                      {translate(
                        customerIsPartner
                          ? 'text_6453819268763979024ad027'
                          : 'text_6453819268763979024ad03f',
                      )}
                    </Typography>
                    <Typography variant="body" color="grey700" forceBreak>
                      {customer?.legalName || customerName}
                    </Typography>
                    {customer?.legalNumber && (
                      <Typography variant="body" color="grey700">
                        {customer?.legalNumber}
                      </Typography>
                    )}
                    {!!formattedCustomerAddress && (
                      <Typography variant="body" color="grey700">
                        {formattedCustomerAddress}
                      </Typography>
                    )}
                    {customer?.email && (
                      <Typography variant="body" color="grey700">
                        {customer?.email}
                      </Typography>
                    )}
                    {customer?.taxIdentificationNumber && (
                      <Typography variant="body" color="grey700">
                        {translate('text_648053ee819b60364c675c78', {
                          taxIdentificationNumber: customer.taxIdentificationNumber,
                        })}
                      </Typography>
                    )}
                  </div>
                </div>

                <FeesSection
                  form={form}
                  hasTaxProvider={hasTaxProvider}
                  customerApplicableTax={customerApplicableTax}
                  taxProviderTaxesResult={taxProviderTaxesResult}
                  setTaxProviderTaxesResult={setTaxProviderTaxesResult}
                  loading={loading}
                />

                <div className="flex w-full flex-col gap-8">
                  <div className="ml-auto w-[472px]">
                    <div className="flex w-[472px] flex-col gap-3">
                      <div className={invoiceFooterLineClassname}>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_6453819268763979024ad0db')}
                        </Typography>
                        <Typography
                          variant="body"
                          color="grey700"
                          data-test="one-off-invoice-subtotal-value"
                        >
                          {subtotalDisplayValue}
                        </Typography>
                      </div>
                      <InvoiceTaxesDisplay
                        hasTaxProvider={hasTaxProvider}
                        taxProviderTaxesToDisplay={taxProviderTaxesToDisplay}
                        taxesToDisplay={taxesToDisplay}
                        hasAnyFee={hasAnyFee}
                        currency={currency}
                        invoiceFooterLineClassname={invoiceFooterLineClassname}
                      />
                      <div className={invoiceFooterLineClassname}>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_6453819268763979024ad0ff')}
                        </Typography>
                        <Typography
                          variant="body"
                          color="grey700"
                          data-test="one-off-invoice-subtotal-amount-due-value"
                        >
                          {amountDueValue}
                        </Typography>
                      </div>
                      <div className={invoiceFooterLineClassname}>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_6453819268763979024ad10f')}
                        </Typography>
                        <Typography
                          variant="body"
                          color="grey700"
                          data-test="one-off-invoice-total-amount-due-value"
                        >
                          {amountDueValue}
                        </Typography>
                      </div>

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
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>

          {(customer?.externalId || customer?.id) && (
            <Card>
              <div className="flex flex-col gap-1">
                <Typography variant="subhead1">
                  {translate('text_17634566456760qoj7hs7jrh')}
                </Typography>
              </div>
              <PaymentMethodsInvoiceSettings
                customer={customer}
                form={paymentMethodsFormAdapter}
                viewType={ViewTypeEnum.OneOffInvoice}
              />
            </Card>
          )}
        </div>

        {!isLoading && (
          <div className="sticky bottom-0 z-navBar border-t border-t-grey-200 bg-white">
            <div className="mx-auto flex h-20 max-w-5xl items-center justify-end gap-3 px-4">
              {!!hasTaxProvider && (
                <Button
                  size="large"
                  variant="secondary"
                  disabled={!isFormValid || !isDirty || !!taxProviderTaxesResult}
                  onClick={async () => {
                    setTaxProviderTaxesErrorMessage(null)

                    const taxProviderResult = await getTaxFromTaxProvider({
                      variables: {
                        input: {
                          currency,
                          customerId: formValues.customerId,
                          fees: formValues.fees.map((f) => ({
                            ...f,
                            unitAmountCents: String(serializeAmount(f.unitAmountCents, currency)),
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
                        setTaxProviderTaxesErrorMessage(
                          LocalTaxProviderErrorsEnum.CustomerAddressError,
                        )
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
                        setTaxProviderTaxesErrorMessage(
                          LocalTaxProviderErrorsEnum.GenericErrorMessage,
                        )
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

                    setTaxProviderTaxesResult(taxProviderResultData?.fetchDraftInvoiceTaxes)
                  }}
                >
                  {translate('text_172383173554743nq9isxpje')}
                </Button>
              )}
              <form.AppForm>
                <form.SubmitButton size="large" dataTest="create-invoice-button">
                  {translate('text_6453819268763979024ad134')}
                </form.SubmitButton>
              </form.AppForm>
            </div>
          </div>
        )}
      </form>
    </>
  )
}

export default CreateInvoice
