import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import _get from 'lodash/get'
import { DateTime } from 'luxon'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { array, number, object, string } from 'yup'

import { Avatar, Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField, TextInputField } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
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
import { addToast } from '~/core/apolloClient'
import { CountryCodes } from '~/core/constants/countryCodes'
import {
  ADD_ITEM_FOR_INVOICE_INPUT_NAME,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  AddOnForInvoiceEditTaxDialogFragmentDoc,
  CurrencyEnum,
  TaxInfosForCreateInvoiceFragment,
  useCreateInvoiceMutation,
  useGetAddonListForInfoiceLazyQuery,
  useGetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { Card, HEADER_TABLE_HEIGHT, MenuPopper, PageHeader, theme } from '~/styles'

const CELL_HEIGHT = 68

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
      legalName
      legalNumber
      taxIdentificationNumber
      state
      zipcode
      taxes {
        id
        ...TaxInfosForCreateInvoice
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

  ${AddOnForInvoiceEditTaxDialogFragmentDoc}
`

type TaxMapType = Map<
  string, // code of the tax
  {
    label: string
    amount: number
    taxRate: number // Used for sorting purpose
  }
>

const CreateInvoice = () => {
  const navigate = useNavigate()
  const { customerId } = useParams()
  const [showAddItem, setShowAddItem] = useState(false)
  const { translate } = useInternationalization()
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

  const customerApplicableTax = useMemo(() => {
    if (!!customer?.taxes?.length) return customer?.taxes
    return taxes?.collection
  }, [customer, taxes])

  // const localVatRate = customer?.vatRate || organization?.billingConfiguration?.vatRate || 0

  const [getAddOns, { data: addOnData }] = useGetAddonListForInfoiceLazyQuery({
    variables: { limit: 20 },
  })

  const [createInvoice] = useCreateInvoiceMutation({
    onCompleted({ createInvoice: createInvoiceResult }) {
      if (!!createInvoiceResult) {
        addToast({
          severity: 'success',
          translateKey: 'text_6453819268763979024ad144',
        })
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
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
          })
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
                taxCodes: addonTaxes?.map(({ code }) => code) || [],
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
          <Item>
            {name} -&nbsp;
            <Typography color="textPrimary">
              (
              {intlFormatNumber(deserializeAmount(amountCents, amountCurrency) || 0, {
                currencyDisplay: 'symbol',
                currency: amountCurrency,
              })}
              )
            </Typography>
          </Item>
        ),
        value: id,
      }
    })
  }, [addOnData])

  const calculation = useMemo(() => {
    const updateOrCreateTaxMap = (
      currentTaxesMap: TaxMapType,
      feeAmount?: number,
      feeUnits?: number,
      feeAppliedTaxes?: TaxInfosForCreateInvoiceFragment[]
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
            fee?.taxes || undefined
          ),
        }
        return acc
      },
      { subTotal: 0, taxesToDisplay: new Map() }
    )

    const vatTotalAmount = totalsReduced?.taxesToDisplay?.size
      ? Array.from(totalsReduced?.taxesToDisplay.values()).reduce((acc, tax) => acc + tax.amount, 0)
      : 0
    const total = totalsReduced.subTotal + vatTotalAmount

    return { subTotal: totalsReduced.subTotal, taxesToDisplay: totalsReduced.taxesToDisplay, total }
  }, [formikProps.values.fees])

  const { subTotal, taxesToDisplay, total } = calculation

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

  return (
    <>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6453819268763979024acfe9')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty ? warningDialogRef.current?.openDialog() : handleClosePage()
          }
        />
      </PageHeader>

      <PageWrapper>
        <CenteredWrapper>
          <BorderedCard $disableChildSpacing>
            {loading ? (
              <>
                <InvoiceHeader>
                  <Skeleton variant="text" width={120} height={12} />
                  <Skeleton
                    className="rounded-conector-skeleton"
                    variant="connectorAvatar"
                    size="medium"
                  />
                </InvoiceHeader>
                <div>
                  <InlineSkeleton>
                    <Skeleton variant="text" width={104} height={12} marginRight={52} />
                    <Skeleton variant="text" width={96} height={12} />
                  </InlineSkeleton>
                  <InlineSkeleton>
                    <Skeleton variant="text" width={104} height={12} marginRight={52} />
                    <Skeleton variant="text" width={96} height={12} />
                  </InlineSkeleton>
                </div>
                <InlineSkeletonBlocks>
                  <div>
                    <InfoSkeleton variant="text" width={104} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                  </div>
                  <div>
                    <InfoSkeleton variant="text" width={104} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                  </div>
                </InlineSkeletonBlocks>
              </>
            ) : (
              <>
                <InvoiceHeader>
                  <Typography variant="headline" color="textSecondary">
                    {translate('text_6453819268763979024acff5')}
                  </Typography>
                  {!!organization?.logoUrl && (
                    <Avatar size="medium" variant="connector">
                      <img src={organization?.logoUrl} alt="company-logo" />
                    </Avatar>
                  )}
                </InvoiceHeader>

                <InlineTopInfo>
                  <Typography variant="caption" color="grey600">
                    {translate('text_6453819268763979024ad01b')}
                  </Typography>
                  <Typography>{DateTime.now().toFormat('LLL. dd, yyyy')}</Typography>
                </InlineTopInfo>

                <FromToInfoWrapper>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_6453819268763979024ad027')}
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
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_6453819268763979024ad03f')}
                    </Typography>
                    <Typography variant="body" color="grey700" forceBreak>
                      {customer?.legalName || customer?.name}
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
                </FromToInfoWrapper>

                <InvoiceTableWrapper>
                  <CurrencyComboBoxField
                    disableClearable
                    data={Object.values(CurrencyEnum).map((currencyType) => ({
                      value: currencyType,
                    }))}
                    disabled={!!customer?.currency}
                    formikProps={formikProps}
                    label={translate('text_6453819268763979024ad057')}
                    name="currency"
                  />

                  <InvoiceTable>
                    <InvoiceTableHeader>
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
                    </InvoiceTableHeader>
                    {!!formikProps?.values?.fees?.length &&
                      formikProps?.values?.fees?.map((fee, i) => {
                        const unitValidationErrorKey = _get(formikProps.errors, `fees.${i}.units`)

                        return (
                          <InvoiceItem key={`item-${i}`} data-test="invoice-item">
                            <div>
                              <ItenName>
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
                                            invoiceDisplayName
                                          )
                                        },
                                      })
                                    }}
                                  />
                                </Tooltip>
                              </ItenName>
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
                              <TextInputField
                                displayErrorText={false}
                                formikProps={formikProps}
                                placeholder={translate('text_62824f0e5d93bc008d268d00')}
                                name={`fees.${i}.units`}
                                type="number"
                                beforeChangeFormatter={['int', 'positiveNumber']}
                              />
                            </Tooltip>
                            <AmountInputField
                              formikProps={formikProps}
                              name={`fees.${i}.unitAmountCents`}
                              currency={currency}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    {getCurrencySymbol(currency)}
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <TaxCell variant="body" color="grey700">
                              {fee.taxes?.length
                                ? fee.taxes.map((tax) => (
                                    <Typography
                                      key={`fee-${i}-applied-taxe-${tax.id}`}
                                      variant="body"
                                      color="grey700"
                                    >
                                      {intlFormatNumber(tax.rate / 100 || 0, {
                                        maximumFractionDigits: 2,
                                        style: 'percent',
                                      })}
                                    </Typography>
                                  ))
                                : '0%'}
                            </TaxCell>
                            <Typography variant="body" color="grey700">
                              {!fee.units
                                ? '-'
                                : intlFormatNumber((fee.units || 0) * (fee.unitAmountCents || 0), {
                                    style: 'currency',
                                    currency,
                                    maximumFractionDigits: 2,
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
                                            newDescription
                                          )
                                        },
                                      })
                                      closePopper()
                                    }}
                                  >
                                    {translate('text_6453819268763979024ad124')}
                                  </Button>
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
                                            newTaxesArray
                                          )
                                        },
                                      })
                                      closePopper()
                                    }}
                                    data-test="invoice-item-edit-taxes"
                                  >
                                    {translate('text_64d40b7e80e64e40710a49ba')}
                                  </Button>
                                  <Button
                                    startIcon="trash"
                                    variant="quaternary"
                                    align="left"
                                    onClick={() => {
                                      const fees = [...formikProps.values.fees]

                                      fees.splice(i, 1)
                                      formikProps.setFieldValue('fees', fees)

                                      closePopper()
                                    }}
                                  >
                                    {translate('text_6453819268763979024ad12c')}
                                  </Button>
                                </MenuPopper>
                              )}
                            </Popper>
                          </InvoiceItem>
                        )
                      })}
                    <InvoiceAddItemSection>
                      {showAddItem ? (
                        <InlineAddonInput>
                          <ComboBox
                            className={ADD_ITEM_FOR_INVOICE_INPUT_NAME}
                            data={addOns}
                            loading={loading}
                            searchQuery={getAddOns}
                            placeholder={translate('text_6453819268763979024ad0ad')}
                            onChange={(value) => {
                              const addOn = addOnData?.addOns?.collection.find(
                                (c) => c.id === value
                              )
                              const addonApplicableTaxes = addOn?.taxes?.length
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
                        </InlineAddonInput>
                      ) : (
                        <Button
                          variant="secondary"
                          startIcon="plus"
                          onClick={() => {
                            setShowAddItem(true)
                            setTimeout(() => {
                              ;(
                                document.querySelector(
                                  `.${ADD_ITEM_FOR_INVOICE_INPUT_NAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                                ) as HTMLElement
                              ).click()
                            }, 0)
                          }}
                          data-test="add-item-button"
                        >
                          {translate('text_6453819268763979024ad0d7')}
                        </Button>
                      )}
                    </InvoiceAddItemSection>
                  </InvoiceTable>
                </InvoiceTableWrapper>
                <InvoiceFooter>
                  <div>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_6453819268763979024ad0db')}
                      </Typography>
                      <Typography
                        variant="body"
                        color="grey700"
                        data-test="one-off-invoice-subtotal-value"
                      >
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(subTotal, {
                              currency,
                              maximumFractionDigits: 2,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                    <>
                      {!!taxesToDisplay?.size ? (
                        <>
                          {Array.from(taxesToDisplay.values())
                            .sort((a, b) => b.taxRate - a.taxRate)
                            .map((taxToDisplay, i) => {
                              return (
                                <InvoiceFooterLine
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
                                          maximumFractionDigits: 2,
                                        })}
                                  </Typography>
                                </InvoiceFooterLine>
                              )
                            })}
                        </>
                      ) : (
                        <InvoiceFooterLine>
                          <Typography variant="bodyHl" color="grey600">
                            {`${translate('text_6453819268763979024ad0e9')} (0%)`}
                          </Typography>
                          <Typography variant="body" color="grey700">
                            {!hasAnyFee
                              ? '-'
                              : intlFormatNumber(0, {
                                  currency,
                                })}
                          </Typography>
                        </InvoiceFooterLine>
                      )}
                    </>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_6453819268763979024ad0ff')}
                      </Typography>
                      <Typography
                        variant="body"
                        color="grey700"
                        data-test="one-off-invoice-subtotal-amount-due-value"
                      >
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(total, {
                              currency,
                              maximumFractionDigits: 2,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_6453819268763979024ad10f')}
                      </Typography>
                      <Typography
                        variant="body"
                        color="grey700"
                        data-test="one-off-invoice-total-amount-due-value"
                      >
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(total, {
                              currency,
                              maximumFractionDigits: 2,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                  </div>
                </InvoiceFooter>
              </>
            )}
          </BorderedCard>
          {!loading && (
            <SubmitButtonWrapper>
              <Button
                fullWidth
                size="large"
                disabled={!formikProps.isValid || !formikProps.dirty}
                onClick={formikProps.submitForm}
                data-test="create-invoice-button"
              >
                {translate('text_6453819268763979024ad134')}
              </Button>
            </SubmitButtonWrapper>
          )}
        </CenteredWrapper>
      </PageWrapper>

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

const PageWrapper = styled.div`
  width: 100%;
`

const BorderedCard = styled(Card)`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const CenteredWrapper = styled.div`
  max-width: 1024px;
  padding: 0 ${theme.spacing(4)};
  margin: ${theme.spacing(12)} auto;
  height: fit-content;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const InvoiceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .rounded-conector-skeleton {
    border-radius: 8px;
  }
`

const InlineSkeleton = styled.div`
  padding: ${theme.spacing(2)} 0;
  display: flex;
  align-items: center;
`

const InlineSkeletonBlocks = styled.div`
  display: flex;
  column-gap: ${theme.spacing(4)};

  > * {
    flex: 1;
  }
`

const InfoSkeleton = styled(Skeleton)`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const InlineTopInfo = styled.div`
  display: grid;
  grid-template-columns: 140px auto;
  column-gap: ${theme.spacing(4)};
  align-items: baseline;
`

const FromToInfoWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};

  > * {
    flex: 1;
  }
`

const InvoiceTableWrapper = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const CurrencyComboBoxField = styled(ComboBoxField)`
  max-width: 160px;
  width: fit-content;
`

const Grid = () => css`
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) minmax(0, 80px) minmax(0, 168px) minmax(0, 64px) minmax(0, 160px)
    minmax(0, 24px);
  gap: ${theme.spacing(3)};

  > *:nth-child(4),
  > *:nth-child(5) {
    display: flex;
    justify-content: flex-end;
  }
`

const InvoiceTable = styled.div`
  width: 100%;
`

const InvoiceTableHeader = styled.div`
  ${Grid()}
  height: ${HEADER_TABLE_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};

  > * {
    display: flex;
    align-items: center;
  }
`

const ItenName = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`

const InvoiceItem = styled.div`
  ${Grid()}
  min-height: ${CELL_HEIGHT}px;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const InvoiceAddItemSection = styled.div`
  margin-top: ${theme.spacing(6)};
`

const InlineAddonInput = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > :first-child {
    flex: 1;
  }
`

const InvoiceFooter = styled.div`
  width: 100%;
  display: inline-block;

  > div {
    width: 472px;
    margin-left: auto;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

const InvoiceFooterLine = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1;
    margin-right: ${theme.spacing(4)};
  }

  > *:last-child {
    width: 168px;
    text-align: end;
  }
`

const SubmitButtonWrapper = styled.div`
  margin: 0 32px;
`

const TaxCell = styled(Typography)`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: ${theme.spacing(1)} 0;
`
