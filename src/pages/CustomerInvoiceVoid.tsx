/*
if (refundable == 0)
  display only creditable

if (refundable amount > 0)
  display both
  creditable amount = creditable - refundable

The combined amount cannt exceed - creditable amount (creditable - refundable)
*/
import { InputAdornment } from '@mui/material'
import { getIn, useFormik } from 'formik'
import { Alert, Button, GenericPlaceholder, Typography } from 'lago-design-system'
import { generatePath, useParams } from 'react-router-dom'
import { array, object, string, ValidationError } from 'yup'

import { CreditTypeEnum, PayBackErrorEnum } from '~/components/creditNote/types'
import { Status, Table } from '~/components/designSystem'
import { AmountInputField, RadioField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  InvoiceForVoidInvoiceDialogFragment,
  InvoiceForVoidInvoiceDialogFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  useGetInvoiceDetailsQuery,
  useVoidInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

enum HandleEnum {
  VoidOnly,
  GenerateCreditNote,
}

type CustomerInvoiceVoidForm = {
  handle: HandleEnum
  payBack: Array<{
    type: CreditTypeEnum
    value?: number
  }>
}

const CustomerInvoiceVoid = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()
  const { customerId, invoiceId } = useParams()
  const { timezone } = useOrganizationInfos()

  const { data, loading, error } = useGetInvoiceDetailsQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
  })

  const [voidInvoice] = useVoidInvoiceMutation({
    onCompleted(voidedData) {
      if (voidedData?.voidInvoice) {
        addToast({
          message: translate('text_65269b43d4d2b15dd929a254'),
          severity: 'success',
        })
      }
    },
    update(cache, { data: invoiceData }) {
      if (!invoiceData?.voidInvoice) return

      const cacheId = `Invoice:${invoiceData?.voidInvoice.id}`

      const previousData: InvoiceForVoidInvoiceDialogFragment | null = cache.readFragment({
        id: cacheId,
        fragment: InvoiceForVoidInvoiceDialogFragmentDoc,
        fragmentName: 'InvoiceForVoidInvoiceDialog',
      })

      cache.writeFragment({
        id: cacheId,
        fragment: InvoiceForVoidInvoiceDialogFragmentDoc,
        fragmentName: 'InvoiceForVoidInvoiceDialog',
        data: {
          ...previousData,
          status: invoiceData.voidInvoice.status,
        },
      })
    },
    refetchQueries: ['getCustomerCreditNotes'],
  })

  const invoice = data?.invoice

  const currency = invoice?.currency || CurrencyEnum.Usd
  const currencySymbol = getCurrencySymbol(currency)

  const amountIsZero = Number(invoice?.totalAmountCents) === 0
  const isPending = invoice?.paymentStatus === InvoicePaymentStatusTypeEnum.Pending

  const maxRefundable = deserializeAmount(invoice?.refundableAmountCents, currency)
  const maxCreditable = deserializeAmount(invoice?.creditableAmountCents, currency)
  const maxTotal = maxCreditable + maxRefundable

  const canGenerateCreditNote = !amountIsZero && (maxRefundable > 0 || maxCreditable > 0)

  const onSubmit = async (values: CustomerInvoiceVoidForm) => {
    if (invoiceId) {
      const input =
        values.handle === HandleEnum.VoidOnly
          ? {
              id: invoiceId as string,
              generate_credit_note: false,
            }
          : {
              id: invoiceId as string,
              generate_credit_note: true,
              refund_amount: values.payBack[0].value ?? 0,
              credit_amount: values.payBack[1].value ?? 0,
            }

      await voidInvoice({
        variables: {
          input,
        },
      })
    }
  }

  const formikProps = useFormik<CustomerInvoiceVoidForm>({
    initialValues: {
      handle: HandleEnum.VoidOnly,
      payBack: [
        {
          type: CreditTypeEnum.refund,
          value: maxRefundable > 0 ? maxRefundable : undefined,
        },
        {
          type: CreditTypeEnum.credit,
          value: maxCreditable > 0 ? maxCreditable - maxRefundable : undefined,
        },
      ],
    },
    validationSchema: object()
      .shape({
        handle: string(),
        payBack: array().of(
          object().shape({
            type: string(),
            value: string(),
          }),
        ),
      })
      .test({
        test: (value, { createError }) => {
          const payBack = value?.payBack

          const refund = Number(payBack?.[0]?.value ?? 0)
          const credit = Number(payBack?.[1]?.value ?? 0)

          const errors: ValidationError[] = []

          const sum = credit + refund

          if (sum > maxTotal) {
            errors.push(
              createError({
                message: PayBackErrorEnum.maxTotalInvoice,
                path: 'payBackErrors',
              }),
            )
          }

          if (refund > maxRefundable) {
            errors.push(
              createError({
                message: PayBackErrorEnum.maxRefund,
                path: 'payBack.0.value',
              }),
            )
          }

          if (credit > maxCreditable) {
            errors.push(
              createError({
                message: PayBackErrorEnum.maxCredit,
                path: 'payBack.1.value',
              }),
            )
          }

          return errors.length ? new ValidationError(errors) : true
        },
      }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit,
  })

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
          {translate('text_65269b43d4d2b15dd929a259')}
        </Typography>

        <Button variant="quaternary" icon="close" onClick={() => onClose()} />
      </CenteredPage.Header>

      {loading && (
        <CenteredPage.Container>
          <FormLoadingSkeleton id="customer-invoice-void" />
        </CenteredPage.Container>
      )}

      {!loading && (
        <CenteredPage.Container>
          <div className="flex flex-col gap-12">
            <Alert type="warning">
              <Typography className="text-grey-700">
                {translate('text_1747902518581z70x872zret')}
              </Typography>
            </Alert>

            <div className="flex flex-col gap-1">
              <Typography className="text-2xl font-semibold text-grey-700">
                {translate('text_1747902518582f4ekodb3ren', {
                  invoiceNumber: invoice?.number,
                })}
              </Typography>

              <Typography className="text-grey-600">
                {translate('text_1747902518582t5nxesgz7dd')}
                <br />
                {translate('text_1747903819929atyvhuolvwe')}
              </Typography>
            </div>

            <div className="flex flex-col gap-6">
              <Typography className="text-lg font-semibold text-grey-700">
                {translate('text_17374729448780zbfa44h1s3')}
              </Typography>

              <Table
                name="invoice"
                data={invoice ? [invoice] : []}
                containerSize={0}
                columns={[
                  {
                    key: 'paymentStatus',
                    title: translate('text_6419c64eace749372fc72b40'),
                    content: ({
                      paymentStatus,
                      status,
                      totalPaidAmountCents,
                      totalAmountCents,
                    }) => {
                      return (
                        <Status
                          {...paymentStatusMapping({
                            paymentStatus,
                            status,
                            totalPaidAmountCents,
                            totalAmountCents,
                          })}
                        />
                      )
                    },
                  },
                  {
                    key: 'number',
                    title: translate('text_64188b3d9735d5007d71226c'),
                    maxSpace: true,
                    content: ({ number }) => number,
                  },
                  {
                    key: 'totalDueAmountCents',
                    title: translate('text_17346988752182hpzppdqk9t'),
                    textAlign: 'right',
                    content: ({ totalAmountCents, totalPaidAmountCents }) => (
                      <>
                        <Typography className="font-medium text-grey-700">
                          {intlFormatNumber(deserializeAmount(totalAmountCents, currency), {
                            currency,
                          })}
                        </Typography>

                        <Typography className="text-nowrap text-sm text-grey-600">
                          {`${translate('text_1741604005109aspaz4chd7y')}: ${intlFormatNumber(
                            deserializeAmount(totalPaidAmountCents, currency),
                            {
                              currency,
                            },
                          )}`}
                        </Typography>
                      </>
                    ),
                  },
                  {
                    key: 'issuingDate',
                    title: translate('text_6419c64eace749372fc72b39'),
                    content: ({ issuingDate }) =>
                      intlFormatDateTime(issuingDate, { timezone }).date,
                  },
                ]}
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Typography className="text-lg font-semibold text-grey-700">
                  {translate('text_1747902518582byw3i46x61k')}
                </Typography>

                <Typography className="text-sm text-grey-600">
                  {translate('text_1747902518582701lwmkfqfb')}
                </Typography>
              </div>

              <div className="flex flex-col gap-4">
                <RadioField
                  name="handle"
                  labelVariant="body"
                  value={HandleEnum.VoidOnly}
                  label={translate('text_1747902518582w3ktz6anw68')}
                  formikProps={formikProps}
                />

                <RadioField
                  name="handle"
                  labelVariant="body"
                  disabled={!canGenerateCreditNote}
                  value={HandleEnum.GenerateCreditNote}
                  label={translate('text_1747902518582u0fpqsnmest')}
                  formikProps={formikProps}
                />

                {formikProps.values.handle === HandleEnum.GenerateCreditNote && (
                  <div className="flex flex-col gap-4">
                    {!isPending && maxRefundable > 0 && (
                      <div className="flex items-center justify-between">
                        <Typography className="font-medium text-grey-700">
                          {translate('text_1747908642632e4crd7uy2dp', {
                            max: intlFormatNumber(maxRefundable, {
                              currency,
                            }),
                          })}
                        </Typography>

                        <AmountInputField
                          name="payBack.0.value"
                          formikProps={formikProps}
                          currency={currency}
                          beforeChangeFormatter={['positiveNumber']}
                          error={
                            !!getIn(formikProps.errors, 'payBack.0.value')
                              ? translate('text_174790864263278xhv5s8l9k', {
                                  max: intlFormatNumber(maxRefundable, { currency }),
                                })
                              : undefined
                          }
                          inputProps={{ style: { textAlign: 'right' } }}
                          InputProps={
                            currency && {
                              startAdornment: (
                                <InputAdornment position="start">{currencySymbol}</InputAdornment>
                              ),
                            }
                          }
                        />
                      </div>
                    )}

                    {maxCreditable > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <Typography className="font-medium text-grey-700">
                            {translate('text_1747908642632dgxu0zy119d', {
                              max: intlFormatNumber(maxCreditable, { currency }),
                            })}
                          </Typography>

                          <Typography className="text-sm text-grey-600">
                            {translate('text_17479086426328lc2pqelu30')}
                          </Typography>
                        </div>

                        <AmountInputField
                          name="payBack.1.value"
                          formikProps={formikProps}
                          currency={currency}
                          beforeChangeFormatter={['positiveNumber']}
                          error={
                            !!getIn(formikProps.errors, 'payBack.1.value')
                              ? translate('text_17479114962319ks0rk1nvla', {
                                  max: intlFormatNumber(maxCreditable, { currency }),
                                })
                              : undefined
                          }
                          inputProps={{ style: { textAlign: 'right' } }}
                          InputProps={
                            currency && {
                              startAdornment: (
                                <InputAdornment position="start">{currencySymbol}</InputAdornment>
                              ),
                            }
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!!getIn(formikProps.errors, 'payBackErrors') && (
                <Alert type="danger">
                  <Typography className="text-grey-700">
                    {translate('text_1747911423385xh4lo4ephnl', {
                      max: intlFormatNumber(maxTotal, { currency }),
                    })}
                  </Typography>
                </Alert>
              )}

              <Alert type="info">
                <Typography className="text-grey-700">
                  {translate('text_1747908642632nja67p9ig0e')}
                </Typography>
              </Alert>
            </div>
          </div>
        </CenteredPage.Container>
      )}

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" size="large" onClick={() => onClose()}>
          {translate('text_6411e6b530cb47007488b027')}
        </Button>

        <Button
          variant="primary"
          size="large"
          danger
          disabled={
            formikProps.values.handle === HandleEnum.GenerateCreditNote && !formikProps.isValid
          }
          onClick={() => formikProps.submitForm()}
        >
          {translate('text_65269b43d4d2b15dd929a259')}
        </Button>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default CustomerInvoiceVoid
