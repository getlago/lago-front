import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { array, object, string } from 'yup'

import { CreditNoteCodeSnippet } from '~/components/creditNote/CreditNoteCodeSnippet'
import { CreditNoteEstimationLine } from '~/components/creditNote/CreditNoteEstimationLine'
import { CreditNoteFormCalculation } from '~/components/creditNote/CreditNoteFormCalculation'
import { CreditNoteItemsForm } from '~/components/creditNote/CreditNoteItemsForm'
import { CreditNoteForm, CreditTypeEnum } from '~/components/creditNote/types'
import { creditNoteFormCalculationCalculation } from '~/components/creditNote/utils'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Icon,
  Skeleton,
  Status,
  StatusProps,
  StatusType,
  Typography,
} from '~/components/designSystem'
import { ComboBoxField, TextInputField } from '~/components/form'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/NavigationEnum'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  generateAddOnFeesSchema,
  generateCreditFeesSchema,
  generateFeesSchema,
} from '~/formValidation/feesSchema'
import {
  CreditNoteReasonEnum,
  CurrencyEnum,
  InvoiceForCreditNoteFormCalculationFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  InvoiceTypeEnum,
  LagoApiError,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateCreditNote } from '~/hooks/useCreateCreditNote'
import { PageHeader } from '~/styles'
import { Content, Main, Side, Subtitle, Title } from '~/styles/mainObjectsForm'

gql`
  fragment CreateCreditNoteInvoice on Invoice {
    id
    currency
    number
    paymentStatus
    creditableAmountCents
    refundableAmountCents
    subTotalIncludingTaxesAmountCents
    availableToCreditAmountCents
    paymentDisputeLostAt
    invoiceType
    ...InvoiceForCreditNoteFormCalculation
  }

  ${InvoiceForCreditNoteFormCalculationFragmentDoc}
`

export const CREDIT_NOTE_REASONS: { reason: CreditNoteReasonEnum; label: string }[] = [
  {
    reason: CreditNoteReasonEnum?.DuplicatedCharge,
    label: 'text_636d85ee6459e3fc0a859123',
  },
  {
    reason: CreditNoteReasonEnum?.FraudulentCharge,
    label: 'text_636d864c7046be9069662e9d',
  },
  {
    reason: CreditNoteReasonEnum?.OrderCancellation,
    label: 'text_636d86390ce8d6d7ed8ce937',
  },
  {
    reason: CreditNoteReasonEnum?.OrderChange,
    label: 'text_636d8642904c9f56a8b2d834',
  },
  {
    reason: CreditNoteReasonEnum?.Other,
    label: 'text_636d86cd9fd41b93c35bf1c7',
  },
  {
    reason: CreditNoteReasonEnum?.ProductUnsatisfactory,
    label: 'text_636d86201507276b7421a981',
  },
]

const mapStatus = (type?: InvoicePaymentStatusTypeEnum | undefined): StatusProps => {
  switch (type) {
    case InvoicePaymentStatusTypeEnum.Succeeded:
      return {
        type: StatusType.success,
        label: 'succeeded',
      }
    case InvoicePaymentStatusTypeEnum.Pending:
      return {
        type: StatusType.default,
        label: 'pending',
      }
    default:
      return {
        type: StatusType.warning,
        label: 'failed',
      }
  }
}

const CreateCreditNote = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { customerId, invoiceId } = useParams()
  const { loading, invoice, feesPerInvoice, feeForAddOn, feeForCredit, onCreate } =
    useCreateCreditNote()
  const currency = invoice?.currency || CurrencyEnum.Usd

  const addOnFeesValidation = useMemo(
    () => generateAddOnFeesSchema(feeForAddOn || [], currency),
    [feeForAddOn, currency],
  )

  const feesValidation = useMemo(
    () => generateFeesSchema(feesPerInvoice || {}, currency),
    [feesPerInvoice, currency],
  )

  const creditFeeValidation = useMemo(
    () => generateCreditFeesSchema(feeForCredit || [], currency),
    [feeForCredit, currency],
  )

  const [payBackValidation, setPayBackValidation] = useState(array())

  const statusMap = mapStatus(invoice?.paymentStatus)
  const formikProps = useFormik<Partial<CreditNoteForm>>({
    initialValues: {
      description: undefined,
      reason: undefined,
      fees: feesPerInvoice,
      addOnFee: feeForAddOn,
      creditFee: feeForCredit,
      payBack: [{ type: undefined, value: undefined }],
      creditAmount: undefined,
      refundAmount: undefined,
    },
    validationSchema: object().shape({
      reason: string().required(''),
      fees: feesValidation,
      addOnFee: addOnFeesValidation,
      creditFee: creditFeeValidation,
      payBack: payBackValidation,
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      const answer = await onCreate(values as CreditNoteForm)

      if (hasDefinedGQLError('DoesNotMatchItemAmounts', answer?.errors)) {
        formikBag.setErrors({
          // @ts-expect-error - Formik doesn't know it here but we have 2 values in the array if we get this error
          payBack: [
            { value: LagoApiError.DoesNotMatchItemAmounts },
            { value: LagoApiError.DoesNotMatchItemAmounts },
          ],
        })
      }
    },
  })

  const hasError = !!formikProps.errors.fees || !!formikProps.errors.addOnFee

  const { feeForEstimate } = useMemo(
    () =>
      creditNoteFormCalculationCalculation({
        currency,
        hasError,
        fees: formikProps.values.fees,
        addonFees: formikProps.values.addOnFee,
      }),
    [currency, formikProps.values.addOnFee, formikProps.values.fees, hasError],
  )

  const isPrepaidCreditsInvoice = invoice?.invoiceType === InvoiceTypeEnum.Credit

  const creditFeeValue = formikProps.values.creditFee?.[0]?.value

  useEffect(() => {
    if (isPrepaidCreditsInvoice && creditFeeValue) {
      formikProps.setFieldValue('payBack', [
        {
          type: CreditTypeEnum.refund,
          value: creditFeeValue,
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrepaidCreditsInvoice, creditFeeValue])

  return (
    <div>
      <PageHeader.Wrapper>
        {loading ? (
          <div>
            <Skeleton variant="text" className="w-30" />
          </div>
        ) : (
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_636bedf292786b19d3398eb9', {
              invoiceNumber: invoice?.number,
            })}
          </Typography>
        )}
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty
              ? warningDialogRef.current?.openDialog()
              : navigate(
                  generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                    customerId: customerId as string,
                    invoiceId: invoiceId as string,
                    tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                  }),
                )
          }
        />
      </PageHeader.Wrapper>
      <Content>
        <Main>
          <div>
            {loading ? (
              <>
                <Skeleton variant="text" className="mb-5 w-70" />
                <Skeleton variant="text" className="mb-10 w-120" />
                <Card className="flex flex-row items-center gap-3 p-4">
                  <Skeleton variant="connectorAvatar" size="medium" />
                  <Skeleton variant="text" className="w-40" />
                </Card>
                <Card>
                  <Skeleton variant="text" className="w-104" />
                  <Skeleton variant="text" className="w-164" />
                  <Skeleton variant="text" className="w-64" />
                </Card>
                <div className="mb-20 px-8">
                  <Button size="large" disabled fullWidth>
                    {translate('text_636bedf292786b19d3398ec4')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Title variant="headline">{translate('text_636bedf292786b19d3398ec4')}</Title>
                  <Subtitle>{translate('text_636bedf292786b19d3398ec6')}</Subtitle>
                </div>

                <Card className="flex flex-row items-center justify-between p-4">
                  <div className="flex flex-row items-center gap-3">
                    <Avatar size="big" variant="connector">
                      <Icon name="document" />
                    </Avatar>

                    <div>
                      <Typography variant="caption">
                        {translate('text_636bedf292786b19d3398ec8')}
                      </Typography>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_636bedf292786b19d3398eca', {
                          invoiceNumber: invoice?.number,
                          subtotal: intlFormatNumber(
                            deserializeAmount(
                              invoice?.subTotalIncludingTaxesAmountCents || 0,
                              currency,
                            ),
                            {
                              currency,
                            },
                          ),
                        })}
                      </Typography>
                    </div>
                  </div>
                  {!!invoice?.paymentDisputeLostAt ? (
                    <Status type={StatusType.danger} label="disputeLost" />
                  ) : (
                    <Status {...statusMap} />
                  )}
                </Card>

                <Card>
                  <Typography variant="subhead">
                    {translate('text_636bedf292786b19d3398ece')}
                  </Typography>
                  <ComboBoxField
                    name="reason"
                    formikProps={formikProps}
                    label={translate('text_636bedf292786b19d3398ed0')}
                    placeholder={translate('text_636bedf292786b19d3398ed2')}
                    data={CREDIT_NOTE_REASONS.map((reason) => ({
                      value: reason.reason,
                      label: translate(reason.label),
                    }))}
                  />
                  <TextInputField
                    name="description"
                    formikProps={formikProps}
                    label={translate('text_636bedf292786b19d3398ed4')}
                    placeholder={translate('text_636bedf292786b19d3398ed6')}
                    rows={3}
                    multiline
                  />
                </Card>

                <Card>
                  <Typography variant="subhead">
                    {translate('text_636bedf292786b19d3398ed8')}
                  </Typography>
                  <div>
                    <Typography variant="caption">
                      {translate('text_636bedf292786b19d3398eda')}
                    </Typography>
                    <Typography variant="bodyHl" color="grey700">
                      {translate(
                        isPrepaidCreditsInvoice
                          ? 'text_17295725378539prq3x0wpry'
                          : 'text_636bedf292786b19d3398edc',
                        {
                          invoiceNumber: invoice?.number,
                          subtotal: intlFormatNumber(
                            deserializeAmount(
                              isPrepaidCreditsInvoice
                                ? invoice?.availableToCreditAmountCents
                                : invoice?.creditableAmountCents || 0,
                              currency,
                            ),
                            {
                              currency,
                            },
                          ),
                        },
                      )}
                    </Typography>
                  </div>

                  <CreditNoteItemsForm
                    isPrepaidCreditsInvoice={isPrepaidCreditsInvoice}
                    formikProps={formikProps}
                    feeForCredit={feeForCredit}
                    feeForAddOn={feeForAddOn}
                    feesPerInvoice={feesPerInvoice}
                    currency={currency}
                  />

                  {isPrepaidCreditsInvoice ? (
                    <>
                      <div className="ml-auto w-full max-w-100">
                        <CreditNoteEstimationLine
                          label={translate('text_1729262339446mk289ygp31g')}
                          value={intlFormatNumber(
                            Number(formikProps.values.creditFee?.[0]?.value || 0),
                            {
                              currency,
                            },
                          )}
                        />
                      </div>

                      <Alert className="mt-6" type="info">
                        {translate('text_1729084495407pcn1mei0hyd')}
                      </Alert>
                    </>
                  ) : (
                    <CreditNoteFormCalculation
                      hasError={hasError}
                      invoice={invoice}
                      formikProps={formikProps}
                      feeForEstimate={feeForEstimate}
                      setPayBackValidation={setPayBackValidation}
                    />
                  )}
                </Card>
                <div className="mb-20 px-8">
                  <Button
                    disabled={!formikProps.isValid}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate('text_636bedf292786b19d3398f12')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Main>
        <Side>
          <CreditNoteCodeSnippet
            loading={loading}
            invoiceId={invoiceId as string}
            formValues={formikProps.values as CreditNoteForm}
            currency={currency}
          />
        </Side>
      </Content>
      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_636bdf192a28e7cf28abf00d')}
        description={translate('text_636bed940028096908b735ed')}
        continueText={translate('text_636beda08285f03477c7e25e')}
        onContinue={() =>
          navigate(
            generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
              customerId: customerId as string,
              invoiceId: invoiceId as string,
              tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
            }),
          )
        }
      />
    </div>
  )
}

export default CreateCreditNote
