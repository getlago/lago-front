import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import _get from 'lodash/get'
import { DateTime } from 'luxon'
import { useCallback, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { array, number, object, string } from 'yup'

import {
  Alert,
  Avatar,
  Button,
  Card,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import { AmountInput, ComboBox, ComboBoxField, ComboboxItem, TextInput } from '~/components/form'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  EditInvoiceDisplayName,
  EditInvoiceDisplayNameRef,
} from '~/components/invoices/EditInvoiceDisplayName'
import {
  EditInvoiceItemDescriptionDialog,
  EditInvoiceItemDescriptionDialogRef,
} from '~/components/invoices/EditInvoiceItemDescriptionDialog'
import {
  EditInvoiceItemTaxDialog,
  EditInvoiceItemTaxDialogRef,
} from '~/components/invoices/EditInvoiceItemTaxDialog'
import { InvoiceFormInput, LocalFeeInput } from '~/components/invoices/types'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CountryCodes } from '~/core/constants/countryCodes'
import {
  ADD_ITEM_FOR_INVOICE_INPUT_NAME,
  appliedTaxEnumedTaxCodeTranslationKey,
  LocalTaxProviderErrorsEnum,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AddOnForInvoiceEditTaxDialogFragmentDoc,
  CurrencyEnum,
  CustomerAccountTypeEnum,
  FetchDraftInvoiceTaxesMutation,
  LagoApiError,
  TaxInfosForCreateInvoiceFragment,
  useCreateInvoiceMutation,
  useFetchDraftInvoiceTaxesMutation,
  useGetAddonListForInfoiceLazyQuery,
  useGetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useSalesForceConfig } from '~/hooks/useSalesForceConfig'
import ErrorImage from '~/public/images/maneki/error.svg'
import { MenuPopper, PageHeader } from '~/styles'
import { StickySubmitBar } from '~/styles/mainObjectsForm'
import { tw } from '~/styles/utils'

gql`
  fragment TaxInfosForCreateInvoice on Tax {
    id
    name
    code
    rate
  }

  mutation createInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
    }
  }

  query getInfosForCreateInvoice($id: ID!) {
    customer(id: $id) {
      id
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
      taxes {
        id
        ...TaxInfosForCreateInvoice
      }
      anrokCustomer {
        id
      }
    }

    organization {
      id
      addressLine1
      addressLine2
      city
      country
      email
      name
      legalName
      legalNumber
      taxIdentificationNumber
      logoUrl
      state
      zipcode
      defaultCurrency
    }

    taxes(page: 1, limit: 1000, appliedToOrganization: true) {
      collection {
        id
        ...TaxInfosForCreateInvoice
      }
    }
  }

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

  ${AddOnForInvoiceEditTaxDialogFragmentDoc}
`

type TaxMapType = Map<
  string,
  {
    label: string
    amount: number
    taxRate: number
    hasEnumedTaxCode?: boolean
  }
>

const CreateInvoice = () => {
  const { translate } = useInternationalization()
  const { customerId } = useParams()
  const navigate = useNavigate()
  const { emitSalesForceEvent, isRunningInSalesForceIframe } = useSalesForceConfig()

  const [showAddItem, setShowAddItem] = useState(false)
  const [taxProviderTaxesResult, setTaxProviderTaxesResult] =
    useState<FetchDraftInvoiceTaxesMutation['fetchDraftInvoiceTaxes']>(null)
  const [taxProviderTaxesErrorMessage, setTaxProviderTaxesErrorMessage] =
    useState<LocalTaxProviderErrorsEnum | null>(null)

  const warningDialogRef = useRef<WarningDialogRef>(null)
  const editDescriptionDialogRef = useRef<EditInvoiceItemDescriptionDialogRef>(null)
  const editTaxDialogRef = useRef<EditInvoiceItemTaxDialogRef>(null)
  const editInvoiceDisplayNameRef = useRef<EditInvoiceDisplayNameRef>(null)

  const handleClosePage = useCallback(() => {
    navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
  }, [navigate, customerId])

  const { data, loading, error } = useGetInfosForCreateInvoiceQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
  })
  const { customer, organization, taxes } = data || {}

  const hasTaxProvider = !!customer?.anrokCustomer?.id

  const customerName = customer?.displayName

  const customerIsPartner = customer?.accountType === CustomerAccountTypeEnum.Partner

  const customerApplicableTax = useMemo(() => {
    if (hasTaxProvider) return []
    if (!!customer?.taxes?.length) return customer?.taxes

    return taxes?.collection
  }, [customer?.taxes, hasTaxProvider, taxes?.collection])

  const [getAddOns, { data: addOnData }] = useGetAddonListForInfoiceLazyQuery({
    variables: { limit: 20 },
  })

  const [getTaxFromTaxProvider] = useFetchDraftInvoiceTaxesMutation({
    fetchPolicy: 'no-cache',
    context: {
      silentErrorCodes: [LagoApiError.UnprocessableEntity],
    },
  })

  const [createInvoice] = useCreateInvoiceMutation({
    onCompleted({ createInvoice: createInvoiceResult }) {
      if (!!createInvoiceResult) {
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
        } else {
          navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
        }
      }
    },
  })

  const formikProps = useFormik<InvoiceFormInput>({
    initialValues: {
      customerId: customerId || '',
      currency: data?.customer?.currency || data?.organization?.defaultCurrency || CurrencyEnum.Usd,
      fees: [],
    },
    validationSchema: object().shape({
      customerId: string().required(''),
      currency: string().required(''),
      fees: array()
        .of(
          object().shape({
            addOnId: string().required(''),
            description: string(),
            units: number().min(1, 'text_645381a65b99559adf6401f0').required(''),
          }),
        )
        .required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async ({ fees, ...values }) => {
      await createInvoice({
        variables: {
          input: {
            ...values,
            fees: fees.map(({ unitAmountCents, taxes: addonTaxes, ...fee }) => {
              return {
                ...fee,
                unitAmountCents: Number(serializeAmount(unitAmountCents, currency) || 0),
                taxCodes: hasTaxProvider ? [] : addonTaxes?.map(({ code }) => code) || [],
              }
            }),
          },
        },
      })
    },
  })
  const currency = formikProps.values.currency || CurrencyEnum.Usd
  const hasAnyFee = formikProps.values.fees.length > 0

  const addOns = useMemo(() => {
    if (!addOnData || !addOnData?.addOns || !addOnData?.addOns?.collection) return []

    return addOnData?.addOns?.collection.map(({ id, name, amountCents, amountCurrency }) => {
      return {
        label: name,
        labelNode: (
          <ComboboxItem>
            <Typography color="grey700" noWrap>
              {name}
            </Typography>
            &nbsp;-&nbsp;
            <Typography color="textPrimary">
              (
              {intlFormatNumber(deserializeAmount(amountCents, amountCurrency) || 0, {
                currencyDisplay: 'symbol',
                currency: amountCurrency,
              })}
              )
            </Typography>
          </ComboboxItem>
        ),
        value: id,
      }
    })
  }, [addOnData])

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

    const totalsReduced = formikProps.values.fees.reduce(
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
  }, [formikProps.values.fees, hasTaxProvider])

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
      formikProps.values.fees.reduce((acc, fee) => {
        acc += (fee.units || 0) * (fee.unitAmountCents || 0)
        return acc
      }, 0) || 0

    return {
      taxProviderTaxesToDisplay: localTaxProviderTaxesToDisplay,
      taxProviderSubtotalHT: localTaxProviderSubtotalHT,
      taxProviderTotalTTC: localTaxProviderSubtotalHT + taxesTotalAmount,
    }
  }, [
    currency,
    formikProps.values.fees,
    hasTaxProvider,
    taxProviderTaxesResult?.collection,
    translate,
  ])

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

  const gridClassname =
    'grid  grid-cols-[minmax(0,1fr)_minmax(0,80px)_minmax(0,168px)_minmax(0,64px)_minmax(0,160px)_minmax(0,24px)] gap-3 [&>*:nth-last-child(-n+3)]:flex [&>*:nth-last-child(-n+3)]:justify-end'
  const invoiceFooterLineClassname =
    'flex items-center [&>*:first-child]:mr-4 [&>*:first-child]:flex-1 [&>*:last-child]:w-42 [&>*:last-child]:text-end'

  return (
    <>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6453819268763979024acfe9')}
        </Typography>

        {!isRunningInSalesForceIframe && (
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              formikProps.dirty ? warningDialogRef.current?.openDialog() : handleClosePage()
            }
          />
        )}
      </PageHeader.Wrapper>
      <div className="size-full">
        <div className="mx-auto my-12 min-h-full max-w-5xl px-4">
          <Card className="gap-8">
            {loading ? (
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
                  {!!organization?.logoUrl && (
                    <Avatar size="big" variant="connector">
                      <img src={organization?.logoUrl ?? undefined} alt="company-logo" />
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

                <div className="grid grid-cols-[140px_auto] items-baseline gap-4">
                  <Typography variant="caption" color="grey600">
                    {translate('text_6453819268763979024ad01b')}
                  </Typography>
                  <Typography>{DateTime.now().toFormat('LLL. dd, yyyy')}</Typography>
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
                      {organization?.legalName || organization?.name}
                    </Typography>
                    {organization?.legalNumber && (
                      <Typography variant="body" color="grey700">
                        {organization?.legalNumber}
                      </Typography>
                    )}
                    {!!(
                      organization?.addressLine1 ||
                      organization?.addressLine2 ||
                      organization?.state ||
                      organization?.country ||
                      organization?.city ||
                      organization?.zipcode
                    ) && (
                      <>
                        {organization?.addressLine1 && (
                          <Typography variant="body" color="grey700">
                            {organization?.addressLine1}
                          </Typography>
                        )}
                        {organization?.addressLine2 && (
                          <Typography variant="body" color="grey700">
                            {organization?.addressLine2}
                          </Typography>
                        )}
                        {(organization?.zipcode || organization?.city || organization?.state) && (
                          <Typography variant="body" color="grey700">
                            {organization?.zipcode} {organization?.city} {organization?.state}
                          </Typography>
                        )}
                        {organization?.country && (
                          <Typography variant="body" color="grey700">
                            {CountryCodes[organization?.country]}
                          </Typography>
                        )}
                      </>
                    )}
                    {organization?.email && (
                      <Typography variant="body" color="grey700">
                        {organization?.email}
                      </Typography>
                    )}
                    {organization?.taxIdentificationNumber && (
                      <Typography variant="body" color="grey700">
                        {translate('text_648053ee819b60364c675c78', {
                          taxIdentificationNumber: organization.taxIdentificationNumber,
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
                    {!!(
                      customer?.addressLine1 ||
                      customer?.addressLine2 ||
                      customer?.state ||
                      customer?.country ||
                      customer?.city ||
                      customer?.zipcode
                    ) && (
                      <>
                        {customer?.addressLine1 && (
                          <Typography variant="body" color="grey700">
                            {customer?.addressLine1}
                          </Typography>
                        )}
                        {customer?.addressLine2 && (
                          <Typography variant="body" color="grey700">
                            {customer?.addressLine2}
                          </Typography>
                        )}
                        {(customer?.zipcode || customer?.city || customer?.state) && (
                          <Typography variant="body" color="grey700">
                            {customer?.zipcode} {customer?.city} {customer?.state}
                          </Typography>
                        )}
                        {customer?.country && (
                          <Typography variant="body" color="grey700">
                            {CountryCodes[customer?.country]}
                          </Typography>
                        )}
                      </>
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

                <ComboBoxField
                  className="w-fit max-w-40"
                  disableClearable
                  data={Object.values(CurrencyEnum).map((currencyType) => ({
                    value: currencyType,
                  }))}
                  disabled={!!customer?.currency}
                  formikProps={formikProps}
                  label={translate('text_6453819268763979024ad057')}
                  name="currency"
                />

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
                  {!!formikProps?.values?.fees?.length &&
                    formikProps?.values?.fees?.map((fee, i) => {
                      const unitValidationErrorKey = _get(formikProps.errors, `fees.${i}.units`)

                      return (
                        <div
                          className={tw(gridClassname, 'min-h-17 items-center shadow-b')}
                          key={`item-${i}`}
                          data-test="invoice-item"
                        >
                          <div>
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

                                    editInvoiceDisplayNameRef.current?.openDialog({
                                      invoiceDisplayName: fee.invoiceDisplayName,
                                      callback: (invoiceDisplayName: string) => {
                                        formikProps.setFieldValue(
                                          `fees.${i}.invoiceDisplayName`,
                                          invoiceDisplayName,
                                        )
                                      },
                                    })
                                  }}
                                />
                              </Tooltip>
                            </div>
                            {!!fee.description && (
                              <Typography variant="body" color="grey600" noWrap>
                                {fee.description}
                              </Typography>
                            )}
                          </div>
                          <Tooltip
                            placement="top-end"
                            title={
                              !!unitValidationErrorKey && translate(`${unitValidationErrorKey}`)
                            }
                            disableHoverListener={!unitValidationErrorKey}
                          >
                            <TextInput
                              name={`fees.${i}.units`}
                              type="number"
                              beforeChangeFormatter={['triDecimal', 'positiveNumber']}
                              error={false}
                              placeholder={translate('text_62824f0e5d93bc008d268d00')}
                              value={formikProps.values.fees[i].units || undefined}
                              onChange={(value) => {
                                formikProps.setFieldValue(`fees.${i}.units`, Number(value))
                                !!hasTaxProvider && setTaxProviderTaxesResult(null)
                              }}
                            />
                          </Tooltip>
                          <AmountInput
                            value={formikProps.values.fees[i].unitAmountCents || 0}
                            currency={currency}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  {getCurrencySymbol(currency)}
                                </InputAdornment>
                              ),
                            }}
                            onChange={(value) => {
                              formikProps.setFieldValue(`fees.${i}.unitAmountCents`, value)
                              !!hasTaxProvider && setTaxProviderTaxesResult(null)
                            }}
                          />
                          <Typography
                            className="flex flex-col items-end py-1"
                            variant="body"
                            color="grey700"
                          >
                            {hasTaxProvider
                              ? !!taxProviderTaxesResult?.collection.length
                                ? taxProviderTaxesResult?.collection
                                    ?.find((t) => t.itemId === fee.addOnId)
                                    ?.taxBreakdown?.map((tax) => (
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
                                : '-'
                              : fee.taxes?.length
                                ? fee.taxes.map((tax) => (
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
                                : '0%'}
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
                                data-test="invoice-item-actions-button"
                              />
                            )}
                          >
                            {({ closePopper }) => (
                              <MenuPopper>
                                <Button
                                  startIcon="text"
                                  variant="quaternary"
                                  align="left"
                                  onClick={() => {
                                    editDescriptionDialogRef.current?.openDialog({
                                      description: fee.description || '',
                                      callback: (newDescription?: string) => {
                                        formikProps.setFieldValue(
                                          `fees.${i}.description`,
                                          newDescription,
                                        )
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
                                      editTaxDialogRef.current?.openDialog({
                                        taxes: fee.taxes,
                                        callback: (newTaxesArray?: LocalFeeInput['taxes']) => {
                                          formikProps.setFieldValue(
                                            `fees.${i}.taxes`,
                                            newTaxesArray,
                                          )
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
                                    const fees = [...formikProps.values.fees]

                                    fees.splice(i, 1)
                                    formikProps.setFieldValue('fees', fees)
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
                            const addonApplicableTaxes = hasTaxProvider
                              ? undefined
                              : addOn?.taxes?.length
                                ? addOn?.taxes
                                : customerApplicableTax

                            if (!!addOn) {
                              formikProps.setFieldValue('fees', [
                                ...formikProps.values.fees,
                                {
                                  addOnId: addOn.id,
                                  name: addOn.name,
                                  description: addOn.description,
                                  invoiceDisplayName: addOn.invoiceDisplayName || '',
                                  units: 1,
                                  unitAmountCents: deserializeAmount(addOn.amountCents, currency),
                                  taxes: addonApplicableTaxes,
                                },
                              ])

                              !!hasTaxProvider && setTaxProviderTaxesResult(null)
                            }

                            setShowAddItem(false)
                          }}
                        />
                        <Tooltip
                          title={translate('text_628b8c693e464200e00e4a10')}
                          placement="top-end"
                        >
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
                        variant="secondary"
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
                        data-test="add-item-button"
                      >
                        {translate('text_6453819268763979024ad0d7')}
                      </Button>
                    )}
                  </div>
                </div>

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
                          {hasTaxProvider
                            ? !taxProviderSubtotalHT
                              ? '-'
                              : intlFormatNumber(taxProviderSubtotalHT, {
                                  currency,
                                })
                            : !hasAnyFee
                              ? '-'
                              : intlFormatNumber(subTotal, {
                                  currency,
                                })}
                        </Typography>
                      </div>
                      <>
                        {hasTaxProvider ? (
                          !taxProviderTaxesToDisplay.size ? (
                            <div className={invoiceFooterLineClassname}>
                              <Typography variant="bodyHl" color="grey600">
                                {translate('text_6453819268763979024ad0e9')}
                              </Typography>
                              <Typography variant="body" color="grey700">
                                {'-'}
                              </Typography>
                            </div>
                          ) : (
                            <>
                              {Array.from(taxProviderTaxesToDisplay.values())
                                .sort((a, b) => b.taxRate - a.taxRate)
                                .map((taxToDisplay, i) => {
                                  return (
                                    <div
                                      className={invoiceFooterLineClassname}
                                      key={`one-off-invoice-tax-item-${i}`}
                                      data-test={`one-off-invoice-tax-item-${i}`}
                                    >
                                      <Typography
                                        variant="bodyHl"
                                        color="grey600"
                                        data-test={`one-off-invoice-tax-item-${i}-label`}
                                      >
                                        {taxToDisplay.label}
                                      </Typography>
                                      <Typography
                                        variant="body"
                                        color="grey700"
                                        data-test={`one-off-invoice-tax-item-${i}-value`}
                                      >
                                        {taxToDisplay.hasEnumedTaxCode
                                          ? null
                                          : !hasAnyFee
                                            ? '-'
                                            : intlFormatNumber(
                                                deserializeAmount(
                                                  taxToDisplay.amount || 0,
                                                  currency,
                                                ),
                                                {
                                                  currency,
                                                },
                                              )}
                                      </Typography>
                                    </div>
                                  )
                                })}
                            </>
                          )
                        ) : !!taxesToDisplay?.size ? (
                          <>
                            {Array.from(taxesToDisplay.values())
                              .sort((a, b) => b.taxRate - a.taxRate)
                              .map((taxToDisplay, i) => {
                                return (
                                  <div
                                    className={invoiceFooterLineClassname}
                                    key={`one-off-invoice-tax-item-${i}`}
                                    data-test={`one-off-invoice-tax-item-${i}`}
                                  >
                                    <Typography
                                      variant="bodyHl"
                                      color="grey600"
                                      data-test={`one-off-invoice-tax-item-${i}-label`}
                                    >
                                      {taxToDisplay.label}
                                    </Typography>
                                    <Typography
                                      variant="body"
                                      color="grey700"
                                      data-test={`one-off-invoice-tax-item-${i}-value`}
                                    >
                                      {!hasAnyFee
                                        ? '-'
                                        : intlFormatNumber(taxToDisplay.amount, {
                                            currency,
                                          })}
                                    </Typography>
                                  </div>
                                )
                              })}
                          </>
                        ) : (
                          <div
                            className={invoiceFooterLineClassname}
                            data-test="one-off-invoice-tax-item-no-tax"
                          >
                            <Typography
                              variant="bodyHl"
                              color="grey600"
                              data-test="one-off-invoice-tax-item-no-tax-label"
                            >
                              {`${translate('text_6453819268763979024ad0e9')} (0%)`}
                            </Typography>
                            <Typography
                              variant="body"
                              color="grey700"
                              data-test="one-off-invoice-tax-item-no-tax-value"
                            >
                              {!hasAnyFee
                                ? '-'
                                : intlFormatNumber(0, {
                                    currency,
                                  })}
                            </Typography>
                          </div>
                        )}
                      </>
                      <div className={invoiceFooterLineClassname}>
                        <Typography variant="bodyHl" color="grey600">
                          {translate('text_6453819268763979024ad0ff')}
                        </Typography>
                        <Typography
                          variant="body"
                          color="grey700"
                          data-test="one-off-invoice-subtotal-amount-due-value"
                        >
                          {hasTaxProvider
                            ? !taxProviderTaxesToDisplay.size
                              ? '-'
                              : intlFormatNumber(taxProviderTotalTTC, {
                                  currency,
                                })
                            : !hasAnyFee
                              ? '-'
                              : intlFormatNumber(total, {
                                  currency,
                                })}
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
                          {hasTaxProvider
                            ? !taxProviderTaxesToDisplay.size
                              ? '-'
                              : intlFormatNumber(taxProviderTotalTTC, {
                                  currency,
                                })
                            : !hasAnyFee
                              ? '-'
                              : intlFormatNumber(total, {
                                  currency,
                                })}
                        </Typography>
                      </div>
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
              </>
            )}
          </Card>
        </div>

        {!loading && (
          <StickySubmitBar>
            <div className="mx-auto flex h-20 max-w-5xl items-center justify-end gap-3 px-4">
              {!!hasTaxProvider && (
                <Button
                  size="large"
                  variant="secondary"
                  disabled={!formikProps.isValid || !formikProps.dirty || !!taxProviderTaxesResult}
                  onClick={async () => {
                    setTaxProviderTaxesErrorMessage(null)

                    const taxProviderResult = await getTaxFromTaxProvider({
                      variables: {
                        input: {
                          currency,
                          customerId: formikProps.values.customerId,
                          fees: formikProps.values.fees.map((f) => ({
                            ...f,
                            unitAmountCents: String(serializeAmount(f.unitAmountCents, currency)),
                          })),
                        },
                      },
                    })

                    const { data: taxProviderResultData, errors } = taxProviderResult

                    if (!!errors?.length) {
                      if (hasDefinedGQLError('CurrencyCodeNotSupported', errors)) {
                        setTaxProviderTaxesErrorMessage(
                          LocalTaxProviderErrorsEnum.CurrencyCodeNotSupported,
                        )
                      } else if (
                        hasDefinedGQLError('CustomerAddressCountryNotSupported', errors) ||
                        hasDefinedGQLError('CustomerAddressCouldNotResolve', errors)
                      ) {
                        setTaxProviderTaxesErrorMessage(
                          LocalTaxProviderErrorsEnum.CustomerAddressError,
                        )
                      } else if (hasDefinedGQLError('ProductExternalIdUnknown', errors)) {
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
              <Button
                size="large"
                disabled={!formikProps.isValid || !formikProps.dirty}
                onClick={formikProps.submitForm}
                data-test="create-invoice-button"
              >
                {translate('text_6453819268763979024ad134')}
              </Button>
            </div>
          </StickySubmitBar>
        )}
      </div>
      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_645388d5bdbd7b00abffa030')}
        description={translate('text_645388d5bdbd7b00abffa031')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={handleClosePage}
      />
      <EditInvoiceItemDescriptionDialog ref={editDescriptionDialogRef} />
      <EditInvoiceItemTaxDialog ref={editTaxDialogRef} />
      <EditInvoiceDisplayName ref={editInvoiceDisplayNameRef} />
    </>
  )
}

export default CreateInvoice
