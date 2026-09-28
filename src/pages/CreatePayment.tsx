import { gql } from '@apollo/client'
import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Status } from '~/components/designSystem/Status'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import { paymentStatusMapping } from '~/core/constants/statusInvoiceMapping'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { PAYMENT_DETAILS_ROUTE, PAYMENTS_ROUTE, useNavigate } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
  LagoApiError,
  useCreatePaymentMutation,
  useGetPayableInvoiceQuery,
  useGetPayableInvoicesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'
import { tw } from '~/styles/utils'

import {
  buildCreatePaymentInput,
  buildCreatePaymentValidationSchema,
  CreatePaymentFormValues,
} from './createPayment/validationSchema'

gql`
  query GetPayableInvoices($customerExternalId: String, $status: [InvoiceStatusTypeEnum!]) {
    invoices(positiveDueAmount: true, customerExternalId: $customerExternalId, status: $status) {
      collection {
        id
        number
        currency
      }
    }
  }

  query GetPayableInvoice($id: ID!) {
    invoice(id: $id) {
      id
      number
      paymentStatus
      status
      totalDueAmountCents
      issuingDate
      currency
      invoiceType
    }
  }

  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
    }
  }
`

const today = DateTime.now().toISO()

export const CREATE_PAYMENT_FORM_ID = 'create-payment-form'
export const CREATE_PAYMENT_CLOSE_BUTTON_TEST_ID = 'create-payment-close-button'
export const CREATE_PAYMENT_CANCEL_BUTTON_TEST_ID = 'create-payment-cancel-button'
export const CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID = 'create-payment-submit-button'

type FieldErrorMap = Record<string, { message: string; path: string[] }>

const buildServerFieldErrors = (
  errors: readonly GraphQLFormattedError[] | undefined,
): FieldErrorMap | undefined => {
  const details = errors?.[0]?.extensions?.details

  if (!details || typeof details !== 'object') return undefined

  const fields = Object.entries(details).reduce<FieldErrorMap>((acc, [field, codes]) => {
    const code = Array.isArray(codes) ? codes[0] : codes

    if (!code) return acc

    acc[field] = { message: String(code), path: [field] }

    return acc
  }, {})

  return Object.keys(fields).length ? fields : undefined
}

const CreatePayment = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { goBack } = useLocationHistory()
  const params = useParams<{ invoiceId?: string }>()
  const [searchParams] = useSearchParams()

  const centralizedDialog = useCentralizedDialog()
  const { timezone } = useOrganizationInfos()

  const openDirtyAttributesWarning = useCallback(
    (onLeave: () => void) => {
      centralizedDialog.open({
        title: translate('text_6244277fe0975300fe3fb940'),
        description: translate('text_6244277fe0975300fe3fb946'),
        actionText: translate('text_6244277fe0975300fe3fb94c'),
        colorVariant: 'danger',
        onAction: onLeave,
      })
    },
    [centralizedDialog, translate],
  )

  // Mirrors the form field so the invoice query, whose result feeds the amount bound the
  // schema is built with, does not have to read a form that does not exist yet.
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(params.invoiceId ?? '')

  const { data: payableInvoices, loading: payableInvoicesLoading } = useGetPayableInvoicesQuery({
    variables: {
      customerExternalId: searchParams.get('externalId'),
      status: [InvoiceStatusTypeEnum.Finalized],
    },
  })

  const { data, loading: invoiceLoading } = useGetPayableInvoiceQuery({
    variables: { id: selectedInvoiceId },
    skip: !selectedInvoiceId,
  })

  const invoice = data?.invoice
  const currency = invoice?.currency ?? CurrencyEnum.Usd
  const maxAmount = deserializeAmount(invoice?.totalDueAmountCents ?? 0, currency)

  const [createPayment] = useCreatePaymentMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createPayment: createdPayment }) {
      if (!!createdPayment) {
        addToast({
          severity: 'success',
          translateKey: 'text_173755495088700ivx6izvjv',
        })
        navigate(generatePath(PAYMENT_DETAILS_ROUTE, { paymentId: createdPayment?.id }))
      }
    },
  })

  const defaultValues = useMemo<CreatePaymentFormValues>(
    () => ({
      invoiceId: params.invoiceId ?? '',
      amountCents: '',
      reference: '',
      createdAt: today,
    }),
    [params.invoiceId],
  )

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildCreatePaymentValidationSchema(maxAmount),
    },
    onSubmit: async ({ value, formApi }) => {
      const { errors } = await createPayment({
        variables: { input: buildCreatePaymentInput(value, currency) },
      })

      const fields = buildServerFieldErrors(errors)

      if (fields) {
        formApi.setErrorMap({ onDynamic: { fields } })
      }
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CREATE_PAYMENT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const amountCentsValue = useStore(form.store, (state) => state.values.amountCents)
  const createdAtValue = useStore(form.store, (state) => state.values.createdAt)

  useEffect(() => {
    if (invoice && invoice.invoiceType === InvoiceTypeEnum.Credit) {
      form.setFieldValue(
        'amountCents',
        deserializeAmount(invoice.totalDueAmountCents, invoice.currency ?? CurrencyEnum.Usd),
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice])

  const remainingAmount = useMemo(() => {
    const totalAmount = deserializeAmount(invoice?.totalDueAmountCents ?? 0, currency)
    const amount = Number(amountCentsValue)

    return totalAmount - amount
  }, [amountCentsValue, invoice, currency])

  const onLeave = () => {
    goBack(generatePath(PAYMENTS_ROUTE))
  }

  const onAbort = () => (isDirty ? openDirtyAttributesWarning(onLeave) : onLeave())

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  const dateTime = intlFormatDateTime(createdAtValue ?? '', {
    timezone,
  })

  const getAmountCentsError = (hasError: boolean): string | false => {
    if (!hasError || !selectedInvoiceId) return false

    return translate('text_6374e868262bab8719eac11f', {
      max: intlFormatNumber(
        deserializeAmount(invoice?.totalDueAmountCents, invoice?.currency ?? CurrencyEnum.Usd),
        { currency },
      ),
    })
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={CREATE_PAYMENT_FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_1737473550277wkq2gsbaiab')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            data-test={CREATE_PAYMENT_CLOSE_BUTTON_TEST_ID}
            onClick={onAbort}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {invoiceLoading && <FormLoadingSkeleton id="create-payment-request" />}
          {!invoiceLoading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="textSecondary">
                  {translate('text_1737471851634wpeojigr27w')}
                </Typography>
                <Typography variant="body">{translate('text_1737472944878vyh7qulgo77')}</Typography>
              </div>

              <div className="flex flex-col gap-12">
                <section className={tw('not-last-child:mb-6', invoice ? 'pb-0' : 'pb-12 shadow-b')}>
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_17374729448780zbfa44h1s3')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1737472944878ggfenh0ifpi')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-6 *:flex-1">
                    <form.AppField
                      name="invoiceId"
                      listeners={{
                        onChange: ({ value }) => setSelectedInvoiceId(value ?? ''),
                      }}
                    >
                      {(field) => (
                        <field.ComboBoxField
                          label={translate('text_64188b3d9735d5007d71226c')}
                          data={(payableInvoices?.invoices.collection ?? []).map(
                            ({ id, number }) => ({
                              value: id,
                              label: number,
                            }),
                          )}
                          placeholder={translate('text_17374729448787bzb5yjrbgt')}
                          emptyText={translate('text_6682c52081acea9052074686')}
                          loading={payableInvoicesLoading}
                          disabled={!!params.invoiceId}
                          disableClearable={!!params.invoiceId}
                          displayErrorText={false}
                        />
                      )}
                    </form.AppField>

                    {invoice && (
                      <Table
                        name="invoice"
                        data={invoice ? [invoice] : []}
                        containerSize={0}
                        columns={[
                          {
                            key: 'paymentStatus',
                            title: translate('text_6419c64eace749372fc72b40'),
                            content: ({ paymentStatus, status }) => {
                              return <Status {...paymentStatusMapping({ paymentStatus, status })} />
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
                            title: translate('text_17374735502775afvcm9pqxk'),
                            textAlign: 'right',
                            content: ({ totalDueAmountCents }) => (
                              <Typography variant="bodyHl" color="textSecondary">
                                {intlFormatNumber(
                                  deserializeAmount(totalDueAmountCents, currency),
                                  {
                                    currency,
                                  },
                                )}
                              </Typography>
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
                    )}
                  </div>
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_1737472944878h2ejm3kxd8h')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_173747294487841dlz5wqd9p')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-6 *:flex-1">
                    <div>
                      <form.AppField name="createdAt">
                        {(field) => (
                          <field.DatePickerField
                            label={translate('text_1737472944878qfpm9xbrrdn')}
                            // Formik rendered no message for an empty date: its yup rule
                            // carried none, and only the unsupported-date one is displayed.
                            errorOverride={field.state.value ? undefined : false}
                          />
                        )}
                      </form.AppField>
                      <Typography variant="caption">
                        {translate('text_1737473550277yfvnl60zpiz', {
                          date: dateTime.date,
                          hour: dateTime.time,
                        })}
                      </Typography>
                    </div>

                    <form.AppField name="reference">
                      {(field) => (
                        <field.TextInputField
                          label={translate('text_1737472944878njss1jk5yik')}
                          helperText={translate('text_1737472944878ksy1jz0b4m9')}
                          placeholder={translate('text_1737473550277onyc98womp2')}
                          displayErrorText={false}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="amountCents">
                      {(field) => (
                        <field.AmountInputField
                          errorOverride={getAmountCentsError(!!field.state.meta.errors.length)}
                          label={translate('text_1737472944878ee19ufaaklg')}
                          currency={currency}
                          beforeChangeFormatter={['positiveNumber']}
                          placeholder="0.00"
                          disabled={invoice?.invoiceType === InvoiceTypeEnum.Credit}
                          InputProps={{
                            startAdornment: currency && (
                              <InputAdornment position="start">
                                {getCurrencySymbol(currency)}
                              </InputAdornment>
                            ),
                          }}
                          helperText={
                            invoice &&
                            translate('text_1737473550277cncnhv0x6cm', {
                              amount: intlFormatNumber(remainingAmount, {
                                currency,
                              }),
                            })
                          }
                        />
                      )}
                    </form.AppField>

                    <Alert type="warning">
                      <Typography color="textSecondary">
                        {translate('text_17374735502775voeeu0q7b7')}
                      </Typography>
                    </Alert>
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            data-test={CREATE_PAYMENT_CANCEL_BUTTON_TEST_ID}
            onClick={onAbort}
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton variant="primary" dataTest={CREATE_PAYMENT_SUBMIT_BUTTON_TEST_ID}>
              {translate('text_1737473550277wkq2gsbaiab')}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default CreatePayment
