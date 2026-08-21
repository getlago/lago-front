import { revalidateLogic } from '@tanstack/react-form'
import { useEffect, useRef } from 'react'
import { generatePath } from 'react-router-dom'

import { BillingEntityFormPicker } from '~/components/billingEntity/BillingEntityFormPicker'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { CURRENCY_DATA } from '~/components/form/CurrencyPicker'
import { addToast } from '~/core/apolloClient'
import { CUSTOMER_DETAILS_ROUTE, Link } from '~/core/router'
import {
  type CurrencyEnum,
  OrderTypeEnum,
  type QuoteDetailItemFragment,
  type UpdateQuoteVersionInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useBillingEntitiesOptions } from '~/hooks/useBillingEntitiesOptions'
import { usePermissions } from '~/hooks/usePermissions'
import {
  buildQuotePreviewProps,
  type QuotePdfHeaderData,
} from '~/pages/quotes/common/buildQuotePreviewProps'
import { useDownloadQuotePdf } from '~/pages/quotes/common/QuotePdfProvider'
import { useApproveQuote } from '~/pages/quotes/hooks/useApproveQuote'
import { useUpdateQuote } from '~/pages/quotes/hooks/useUpdateQuote'
import { getQuoteMutationErrors } from '~/pages/quotes/utils/quoteMutationErrors'

import { type EditQuoteAsideFormValues, editQuoteAsideSchema } from './validationSchema'

import { getQuoteOrderTypeTranslationKey } from '../common/getQuoteOrderTypeTranslationKey'

export const EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID = 'edit-quote-aside-quote-type'
export const EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID = 'edit-quote-aside-customer'
export const EDIT_QUOTE_ASIDE_CUSTOMER_LINK_TEST_ID = 'edit-quote-aside-customer-link'
export const EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID = 'edit-quote-aside-billing-entity'
export const EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID = 'edit-quote-aside-subscription'
export const EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID = 'edit-quote-aside-currency'
export const EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID = 'edit-quote-aside-currency-combobox'
export const EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID = 'edit-quote-aside-download-pdf'
export const EDIT_QUOTE_ASIDE_APPROVE_TEST_ID = 'edit-quote-aside-approve'

interface EditQuoteAsideProps {
  quote: QuoteDetailItemFragment | null | undefined
  isSaving?: boolean
  onSaveStart?: () => void
  onSaveFinished?: () => void
  onSaveError?: (payload: UpdateQuoteVersionInput) => void
}

const EditQuoteAside = ({
  quote,
  isSaving,
  onSaveStart,
  onSaveFinished,
  onSaveError,
}: EditQuoteAsideProps) => {
  if (!quote) return null

  return (
    <EditQuoteAsideForm
      quote={quote}
      isSaving={isSaving}
      onSaveStart={onSaveStart}
      onSaveFinished={onSaveFinished}
      onSaveError={onSaveError}
    />
  )
}

const EditQuoteAsideForm = ({
  quote,
  isSaving,
  onSaveStart,
  onSaveFinished,
  onSaveError,
}: {
  quote: QuoteDetailItemFragment
  isSaving?: boolean
  onSaveStart?: () => void
  onSaveFinished?: () => void
  onSaveError?: (payload: UpdateQuoteVersionInput) => void
}) => {
  const { translate } = useInternationalization()
  const { updateQuoteVersion } = useUpdateQuote({ onUpdateFinished: onSaveFinished })
  const { hasPermissions } = usePermissions()
  const { download } = useDownloadQuotePdf()
  const { goToApproveQuote } = useApproveQuote()
  const { hasMultipleEntities } = useBillingEntitiesOptions({ includeInheritOption: true })

  const canApprove = hasPermissions(['quotesApprove'])
  const pdfHeader: QuotePdfHeaderData = {
    documentNumber: quote.number,
    rows: [
      translate('text_17818008544903clzyy4ziu1', {
        quoteNumberWithVersion: `${quote.number} - v${quote.currentVersion.version}`,
      }),
    ],
  }

  const isAmendment = quote.orderType === OrderTypeEnum.SubscriptionAmendment
  const versionId = quote.currentVersion.id
  const canPickBillingEntity = hasMultipleEntities && !isAmendment
  const versionBillingEntityId = quote.currentVersion.billingEntityId ?? ''

  const getDefaultValues = (): EditQuoteAsideFormValues => {
    return {
      orderTypeLabel: translate(getQuoteOrderTypeTranslationKey(quote.orderType)),
      billingEntityId: versionBillingEntityId,
      currency: (quote.currentVersion.currency as CurrencyEnum | undefined) ?? undefined,
      subscriptionLabel: quote.subscription
        ? `${quote.subscription.plan?.name ?? ''} - ${quote.subscription.externalId}`
        : undefined,
    }
  }

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validationLogic: revalidateLogic({ mode: 'change' }),
    validators: {
      onDynamic: editQuoteAsideSchema,
    },
  })

  const updateQuoteVersionRef = useRef(updateQuoteVersion)
  const onSaveStartRef = useRef(onSaveStart)
  const onSaveErrorRef = useRef(onSaveError)

  updateQuoteVersionRef.current = updateQuoteVersion
  onSaveStartRef.current = onSaveStart
  onSaveErrorRef.current = onSaveError

  const versionCurrency = (quote.currentVersion.currency as CurrencyEnum | undefined) ?? undefined
  const persistedCurrencyRef = useRef(versionCurrency)
  const persistedBillingEntityIdRef = useRef(versionBillingEntityId)

  useEffect(() => {
    persistedCurrencyRef.current = versionCurrency

    if (versionCurrency && form.getFieldValue('currency') !== versionCurrency) {
      form.setFieldValue('currency', versionCurrency)
    }
  }, [versionCurrency, form])

  useEffect(() => {
    persistedBillingEntityIdRef.current = versionBillingEntityId

    if (form.getFieldValue('billingEntityId') !== versionBillingEntityId) {
      form.setFieldValue('billingEntityId', versionBillingEntityId)
    }
  }, [versionBillingEntityId, form])

  const saveVersionField = async (payload: UpdateQuoteVersionInput): Promise<boolean> => {
    onSaveStartRef.current?.()

    try {
      const result = await updateQuoteVersionRef.current(payload, false)

      if (result.data?.updateQuoteVersion) return true

      getQuoteMutationErrors(result.errors, translate).forEach(({ message }) =>
        addToast({ severity: 'danger', message }),
      )
      onSaveErrorRef.current?.(payload)

      return false
    } catch {
      onSaveErrorRef.current?.(payload)

      return false
    }
  }

  const handleCurrencyChange = async (currency: CurrencyEnum | undefined): Promise<void> => {
    if (isAmendment) return
    if (!versionId || !currency) return

    const previous = persistedCurrencyRef.current

    if (currency === previous) return

    persistedCurrencyRef.current = currency

    if (await saveVersionField({ id: versionId, currency })) return

    persistedCurrencyRef.current = previous

    if (previous) form.setFieldValue('currency', previous)
  }

  const handleBillingEntityChange = async (billingEntityId: string): Promise<void> => {
    if (!versionId) return

    const previous = persistedBillingEntityIdRef.current

    if (billingEntityId === previous) return

    persistedBillingEntityIdRef.current = billingEntityId

    if (await saveVersionField({ id: versionId, billingEntityId: billingEntityId || null })) return

    persistedBillingEntityIdRef.current = previous
    form.setFieldValue('billingEntityId', previous)
  }

  const gridClassName = 'grid grid-cols-[7.5rem_1fr] items-center gap-0 gap-y-2'

  const handleDownloadPdf = () => {
    download(
      buildQuotePreviewProps({
        version: quote.currentVersion,
        customer: quote.customer,
        images: (quote.images ?? {}) as Record<string, string>,
        header: pdfHeader,
      }),
    ).catch(() => undefined)
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-col gap-3 px-3 py-4">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1777540287773ez178bggf4h')}
        </Typography>
        <div className={gridClassName}>
          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID}
          >
            {translate('text_1776238919927x1y2z3a4b5c')}
          </Typography>
          <form.AppField name="orderTypeLabel">
            {(field) => <field.TextInputField disabled />}
          </form.AppField>
          {canPickBillingEntity && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID}
              >
                {translate('text_17436114971570doqrwuwhf0')}
              </Typography>
              <form.AppField
                name="billingEntityId"
                listeners={{
                  onChange: ({ value }) => {
                    handleBillingEntityChange(value)
                  },
                }}
              >
                {(field) => (
                  <BillingEntityFormPicker
                    includeInheritOption
                    value={field.state.value}
                    onChange={(id) => field.handleChange(id ?? '')}
                  />
                )}
              </form.AppField>
            </>
          )}
        </div>
      </div>
      <hr className="border-grey-300" />
      <div className="flex flex-col gap-3 px-3 py-4">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1777552621583netdlhbg5i7')}
        </Typography>
        <div className={gridClassName}>
          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID}
          >
            {translate('text_1776238919927l1m2n3o4p5q')}
          </Typography>
          <Link
            className="w-fit"
            data-test={EDIT_QUOTE_ASIDE_CUSTOMER_LINK_TEST_ID}
            to={generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: quote.customer.id })}
          >
            <Typography variant="body" color="inherit" noWrap>
              {quote.customer.displayName}
            </Typography>
          </Link>

          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID}
          >
            {translate('text_632b4acf0c41206cbcb8c324')}
          </Typography>
          <form.AppField
            name="currency"
            listeners={{
              onChange: ({ value }) => {
                handleCurrencyChange(value)
              },
            }}
          >
            {(field) => (
              <field.ComboBoxField
                dataTest={EDIT_QUOTE_ASIDE_CURRENCY_COMBOBOX_TEST_ID}
                disabled={isAmendment}
                disableClearable
                placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
                data={CURRENCY_DATA}
              />
            )}
          </form.AppField>

          {quote.subscription && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID}
              >
                {translate('text_1776238919927d6e7f8g9h0i')}
              </Typography>
              <form.AppField name="subscriptionLabel">
                {(field) => <field.TextInputField disabled />}
              </form.AppField>
            </>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 mt-auto flex justify-end gap-3 border-t border-grey-200 bg-white p-4">
        <Button
          variant="secondary"
          data-test={EDIT_QUOTE_ASIDE_DOWNLOAD_PDF_TEST_ID}
          loading={isSaving}
          disabled={!!isSaving}
          onClick={handleDownloadPdf}
        >
          {translate('text_17797156485850t8yms6hf7z')}
        </Button>
        {canApprove && (
          <Button
            variant="primary"
            data-test={EDIT_QUOTE_ASIDE_APPROVE_TEST_ID}
            loading={isSaving}
            disabled={!!isSaving}
            onClick={() => goToApproveQuote(quote.id, quote.currentVersion.id)}
          >
            {translate('text_1776848720529vv5zmyyq94k')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default EditQuoteAside
