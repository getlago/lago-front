import { revalidateLogic, useStore } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { FormEvent, useCallback, useEffect, useMemo, useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { CreditNoteEstimationLine } from '~/components/creditNote/CreditNoteEstimationLine'
import { CreditNoteFormAllocation } from '~/components/creditNote/CreditNoteFormAllocation'
import { CreditNoteFormCalculation } from '~/components/creditNote/CreditNoteFormCalculation'
import { CreditNoteItemsForm } from '~/components/creditNote/CreditNoteItemsForm'
import { CreditNoteForm, CreditTypeEnum } from '~/components/creditNote/types'
import { useCreditNoteFormCalculation } from '~/components/creditNote/useCreditNoteFormCalculation'
import {
  buildInitialPayBack,
  canCreateCreditNote,
  creditNoteFormCalculationCalculation,
  creditNoteFormHasAtLeastOneFeeChecked,
  hasOffsettableAmount,
} from '~/components/creditNote/utils'
import { Alert } from '~/components/designSystem/Alert'
import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Card } from '~/components/designSystem/Card'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CreditNoteReasonEnum,
  CurrencyEnum,
  InvoiceTypeEnum,
  LagoApiError,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { PageHeader } from '~/styles'

import { useCreateCreditNote } from './common/useCreateCreditNote'
import { CreditNoteMetadataSection } from './metadataForm/CreditNoteMetadataSection'
import {
  AllocationLimits,
  buildCreditNoteSchema,
  CreditNoteFormValues,
  hasCreditNoteFeeErrors,
} from './validationSchema'

export const CREATE_CREDIT_NOTE_FORM_ID = 'create-credit-note-form'

// These writes mirror another field rather than record user input. Stamping the form as
// touched would stop `update()` re-seeding it once the invoice query resolves.
const DERIVED_WRITE = { dontUpdateMeta: true }

export const SUBMIT_BUTTON_TEST_ID = 'submit-credit-note-button'
export const REASON_COMBOBOX_TEST_ID = 'reason-combobox'

export const DESCRIPTION_INPUT_TEST_ID = 'description-input'
export const PREPAID_CREDITS_REFUND_ALERT_TEST_ID = 'prepaid-credits-refund-alert'
export const CLOSE_BUTTON_TEST_ID = 'close-credit-note-button'

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

const CreateCreditNote = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const centralizedDialog = useCentralizedDialog()
  const { customerId, invoiceId } = useParams()

  const navigateBack = useCallback(
    () =>
      navigate(
        generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
          customerId: customerId as string,
          invoiceId: invoiceId as string,
          tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
        }),
      ),
    [customerId, invoiceId, navigate],
  )

  const openDirtyAttributesWarning = () =>
    centralizedDialog.open({
      title: translate('text_636bdf192a28e7cf28abf00d'),
      description: translate('text_636bed940028096908b735ed'),
      actionText: translate('text_636beda08285f03477c7e25e'),
      colorVariant: 'danger',
      onAction: () => navigateBack(),
    })
  const {
    loading,
    invoice,
    feesPerInvoice,
    feeForAddOn,
    feeForCredit,
    hasCreditableOrRefundableAmount,
    isInvoiceFullyCovered,
    onCreate,
  } = useCreateCreditNote()
  const currency = invoice?.currency || CurrencyEnum.Usd
  const isPrepaidCreditsInvoice = invoice?.invoiceType === InvoiceTypeEnum.Credit

  const defaultValues: CreditNoteFormValues = useMemo(
    () => ({
      description: undefined,
      reason: undefined,
      fees: feesPerInvoice,
      addOnFee: feeForAddOn,
      creditFee: feeForCredit,
      payBack: buildInitialPayBack(invoice),
      metadata: [],
    }),
    [feesPerInvoice, feeForAddOn, feeForCredit, invoice],
  )

  const allocationLimits = useRef<AllocationLimits>({
    totalTaxIncluded: 0,
    maxCreditableAmount: 0,
    maxRefundableAmount: 0,
    maxOffsettableAmount: 0,
  })

  const validationSchema = useMemo(
    () =>
      buildCreditNoteSchema({
        currency,
        feesPerInvoice,
        feeForAddOn,
        feeForCredit,
        isPrepaidCreditsInvoice,
        getAllocationLimits: () => allocationLimits.current,
      }),
    [currency, feesPerInvoice, feeForAddOn, feeForCredit, isPrepaidCreditsInvoice],
  )

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CREATE_CREDIT_NOTE_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      const answer = await onCreate(value as CreditNoteForm)

      if (hasDefinedGQLError('DoesNotMatchItemAmounts', answer?.errors)) {
        const issue = (index: number) => ({
          message: LagoApiError.DoesNotMatchItemAmounts,
          path: ['payBack', index, 'value'],
        })

        // `form` carries the flat path map the allocation section reads, `fields` is what
        // puts each input in its error state; the two are not interchangeable.
        formApi.setErrorMap({
          onDynamic: {
            form: {
              'payBack[0].value': [issue(0)],
              'payBack[1].value': [issue(1)],
            },
            fields: {
              'payBack[0].value': issue(0),
              'payBack[1].value': issue(1),
            },
          },
        })
      }
    },
  })

  const formValues = useStore(form.store, (state) => state.values)
  const isDirty = useStore(form.store, (state) => !state.isDefaultValue)

  const hasError = useMemo(
    () =>
      hasCreditNoteFeeErrors({
        currency,
        feesPerInvoice,
        feeForAddOn,
        fees: formValues.fees,
        addOnFee: formValues.addOnFee,
      }),
    [currency, feesPerInvoice, feeForAddOn, formValues.fees, formValues.addOnFee],
  )

  const { feeForEstimate } = useMemo(
    () =>
      creditNoteFormCalculationCalculation({
        currency,
        hasError,
        fees: formValues.fees,
        addonFees: formValues.addOnFee,
      }),
    [currency, formValues.addOnFee, formValues.fees, hasError],
  )

  const creditNoteCalculation = useCreditNoteFormCalculation({
    invoice,
    feeForEstimate,
  })

  allocationLimits.current = {
    totalTaxIncluded: creditNoteCalculation.totalTaxIncluded,
    maxCreditableAmount: creditNoteCalculation.maxCreditableAmount,
    maxRefundableAmount: creditNoteCalculation.maxRefundableAmount,
    maxOffsettableAmount: creditNoteCalculation.maxOffsettableAmount,
  }

  const creditFeeValue = formValues.creditFee?.[0]?.value
  const hasOffsettable = hasOffsettableAmount(invoice)

  useEffect(() => {
    if (isPrepaidCreditsInvoice && creditFeeValue) {
      if (hasCreditableOrRefundableAmount) {
        form.setFieldValue(
          'payBack',
          [{ type: CreditTypeEnum.refund, value: creditFeeValue }],
          DERIVED_WRITE,
        )
      } else if (hasOffsettable) {
        form.setFieldValue(
          'payBack',
          [{ type: CreditTypeEnum.offset, value: creditFeeValue }],
          DERIVED_WRITE,
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrepaidCreditsInvoice, creditFeeValue, hasCreditableOrRefundableAmount, hasOffsettable])

  const isInitialFeesMount = useRef(true)

  useEffect(() => {
    if (isInitialFeesMount.current) {
      isInitialFeesMount.current = false
      return
    }

    if (isPrepaidCreditsInvoice) return

    form.setFieldValue(
      'payBack',
      (currentPayBack) => (currentPayBack || []).map((item) => ({ ...item, value: undefined })),
      DERIVED_WRITE,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues.fees, formValues.addOnFee])

  const formHasAtLeastOneFeeChecked: boolean = useMemo(
    () => creditNoteFormHasAtLeastOneFeeChecked(formValues),
    [formValues],
  )

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  const renderItemsSection = (): JSX.Element => {
    if (isInvoiceFullyCovered) {
      return <Alert type="danger">{translate('text_1783670256902guo0smcgak1')}</Alert>
    }

    return (
      <>
        <CreditNoteItemsForm
          form={form}
          isPrepaidCreditsInvoice={isPrepaidCreditsInvoice}
          feeForCredit={feeForCredit}
          feeForAddOn={feeForAddOn}
          feesPerInvoice={feesPerInvoice}
          currency={currency}
        />

        {isPrepaidCreditsInvoice ? (
          <>
            <div className="ml-auto w-full max-w-100">
              <CreditNoteEstimationLine
                label={
                  hasCreditableOrRefundableAmount
                    ? translate('text_17270794543889mcmuhfq70p')
                    : translate('text_1767883339943r32jn2ioyeu')
                }
                value={intlFormatNumber(Number(creditFeeValue || 0), { currency })}
              />
            </div>

            {hasCreditableOrRefundableAmount && (
              <Alert className="mt-6" type="info" data-test={PREPAID_CREDITS_REFUND_ALERT_TEST_ID}>
                {translate('text_1729084495407pcn1mei0hyd')}
              </Alert>
            )}
          </>
        ) : (
          <CreditNoteFormCalculation
            hasError={hasError}
            currency={creditNoteCalculation.currency}
            estimationLoading={creditNoteCalculation.estimationLoading}
            hasCouponLine={creditNoteCalculation.hasCouponLine}
            proRatedCouponAmount={creditNoteCalculation.proRatedCouponAmount}
            totalExcludedTax={creditNoteCalculation.totalExcludedTax}
            taxes={creditNoteCalculation.taxes}
            totalTaxIncluded={creditNoteCalculation.totalTaxIncluded}
            canOnlyCredit={creditNoteCalculation.canOnlyCredit}
          />
        )}
      </>
    )
  }

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
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
              {translate('text_636bdef6565341dcb9cfb127')}
            </Button>
          </div>
        </>
      )
    }

    return (
      <>
        <CenteredPage.PageTitle
          title={translate('text_636bdef6565341dcb9cfb127')}
          description={translate('text_636bedf292786b19d3398ec6')}
        />
        <div className="flex flex-col gap-12 border-b border-grey-300 pb-12">
          <div className="flex flex-col">
            <Typography className="mb-2" variant="subhead1" color="grey700">
              {translate('text_17374729448780zbfa44h1s3')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1766074535186op0u7tt7ses')}
            </Typography>

            <div className="mt-3 overflow-hidden rounded-xl border border-grey-300">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar size="big" variant="connector">
                    <Icon name="document" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_634687079be251fdb43833fb')}
                    </Typography>
                    <Typography variant="bodyHl" color="grey700">
                      {invoice?.number}
                    </Typography>
                  </div>
                </div>
                <div className="text-right">
                  <Typography variant="caption" color="grey600">
                    {translate('text_65a6b4e2cb38d9b70ec53d83')}
                  </Typography>
                  <Typography variant="bodyHl" color="grey700">
                    {intlFormatNumber(deserializeAmount(invoice?.totalAmountCents, currency), {
                      currency,
                    })}
                  </Typography>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-grey-300 bg-grey-100 p-4">
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_1766074535187gdkj5p0iln0')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {intlFormatNumber(
                      deserializeAmount(invoice?.totalPaidAmountCents || 0, currency),
                      { currency },
                    )}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_17374735502775afvcm9pqxk')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {intlFormatNumber(
                      deserializeAmount(invoice?.totalDueAmountCents || 0, currency),
                      { currency },
                    )}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="grey600">
                    {translate('text_1766074535187nro7qatdzyh')}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {intlFormatNumber(
                      deserializeAmount(invoice?.refundableAmountCents || 0, currency),
                      { currency },
                    )}
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Typography variant="subhead1">{translate('text_636bedf292786b19d3398ece')}</Typography>
            <form.AppField name="reason">
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_636bedf292786b19d3398ed0')}
                  placeholder={translate('text_636bedf292786b19d3398ed2')}
                  data={CREDIT_NOTE_REASONS.map((reason) => ({
                    value: reason.reason,
                    label: translate(reason.label),
                  }))}
                  dataTest={REASON_COMBOBOX_TEST_ID}
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextInputField
                  label={translate('text_636bedf292786b19d3398ed4')}
                  placeholder={translate('text_636bedf292786b19d3398ed6')}
                  rows={3}
                  multiline
                  data-test={DESCRIPTION_INPUT_TEST_ID}
                />
              )}
            </form.AppField>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-b border-grey-300 pb-12">
          <div>
            <Typography className="mb-2" variant="subhead1" color="grey700">
              {translate('text_636bedf292786b19d3398ed8')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1766133873554m5a3a9c8x2f')}
            </Typography>
          </div>

          <div>
            <Typography variant="caption">{translate('text_636bedf292786b19d3398eda')}</Typography>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_636bedf292786b19d3398edc', {
                invoiceNumber: invoice?.number,
                subtotal: intlFormatNumber(
                  deserializeAmount(invoice?.subTotalIncludingTaxesAmountCents || 0, currency),
                  { currency },
                ),
              })}
            </Typography>
          </div>

          {renderItemsSection()}
        </div>

        {!isPrepaidCreditsInvoice && canCreateCreditNote(invoice) && (
          <div className="flex flex-col gap-6 border-b border-grey-300 pb-12">
            <CreditNoteFormAllocation
              form={form}
              currency={creditNoteCalculation.currency}
              maxCreditableAmount={creditNoteCalculation.maxCreditableAmount}
              maxRefundableAmount={creditNoteCalculation.maxRefundableAmount}
              maxOffsettableAmount={creditNoteCalculation.maxOffsettableAmount}
              totalTaxIncluded={creditNoteCalculation.totalTaxIncluded}
              estimationLoading={creditNoteCalculation.estimationLoading}
            />
          </div>
        )}

        <div className="flex flex-col">
          <CreditNoteMetadataSection form={form} />
        </div>
      </>
    )
  }

  return (
    <form id={CREATE_CREDIT_NOTE_FORM_ID} onSubmit={handleSubmit}>
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
          data-test={CLOSE_BUTTON_TEST_ID}
          onClick={() => (isDirty ? openDirtyAttributesWarning() : navigateBack())}
        />
      </PageHeader.Wrapper>
      <CenteredPage.Container>{renderContent()}</CenteredPage.Container>

      <CenteredPage.StickyFooter>
        <div className="flex h-full items-center justify-end gap-3">
          <Button
            variant="quaternary"
            onClick={() =>
              navigate(
                generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                  customerId: customerId ?? '',
                  invoiceId: invoiceId ?? '',
                  tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
                }),
              )
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              disabled={!formHasAtLeastOneFeeChecked}
              fullWidth
              dataTest={SUBMIT_BUTTON_TEST_ID}
            >
              {translate('text_636bedf292786b19d3398f12')}
            </form.SubmitButton>
          </form.AppForm>
        </div>
      </CenteredPage.StickyFooter>
    </form>
  )
}

export default CreateCreditNote
