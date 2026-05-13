import { revalidateLogic, useStore } from '@tanstack/react-form'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { CurrencyEnum, type QuoteDetailItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useUpdateQuote } from '~/pages/quotes/hooks/useUpdateQuote'

import { type EditQuoteAsideFormValues, editQuoteAsideSchema } from './validationSchema'

import { getQuoteOrderTypeTranslationKey } from '../common/getQuoteOrderTypeTranslationKey'

const AUTO_SAVE_DELAY_MS = 2000

export const EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID = 'edit-quote-aside-quote-type'
export const EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID = 'edit-quote-aside-customer'
export const EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID = 'edit-quote-aside-billing-entity'
export const EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID = 'edit-quote-aside-subscription'
export const EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID = 'edit-quote-aside-currency'
export const EDIT_QUOTE_ASIDE_START_DATE_TEST_ID = 'edit-quote-aside-start-date'
export const EDIT_QUOTE_ASIDE_END_DATE_TEST_ID = 'edit-quote-aside-end-date'
export const EDIT_QUOTE_ASIDE_PAYMENT_TERM_TEST_ID = 'edit-quote-aside-payment-term'

interface EditQuoteAsideProps {
  quote: QuoteDetailItemFragment | null | undefined
}

const EditQuoteAside = ({ quote }: EditQuoteAsideProps) => {
  if (!quote) return null

  return <EditQuoteAsideForm quote={quote} />
}

const formatNetPaymentTerm = (
  netPaymentTerm: number | null | undefined,
  translate: ReturnType<typeof useInternationalization>['translate'],
): string => {
  if (typeof netPaymentTerm !== 'number') return '-'
  if (netPaymentTerm === 0) return translate('text_64c7a89b6c67eb6c98898125')

  return translate('text_64c7a89b6c67eb6c9889815f', { days: netPaymentTerm }, netPaymentTerm)
}

const EditQuoteAsideForm = ({ quote }: { quote: QuoteDetailItemFragment }) => {
  const { translate } = useInternationalization()
  const { updateQuoteVersion } = useUpdateQuote()

  const hasCustomerCurrency = !!quote.customer.currency
  const hasSubscription = !!quote.subscription
  const versionId = quote.currentVersion.id

  const billingItems = quote.currentVersion.billingItems as
    | { startDate?: string; endDate?: string; currency?: CurrencyEnum }
    | null
    | undefined

  const getDefaultValues = (): EditQuoteAsideFormValues => {
    return {
      orderTypeLabel: translate(getQuoteOrderTypeTranslationKey(quote.orderType)),
      customerName: quote.customer.name ?? '',
      billingEntityId: quote.customer.billingEntity?.id ?? '',
      currency: quote.customer.currency ?? billingItems?.currency ?? undefined,
      subscriptionLabel: quote.subscription
        ? `${quote.subscription.plan?.name ?? ''} - ${quote.subscription.externalId}`
        : undefined,
      startDate: quote.subscription?.subscriptionAt ?? billingItems?.startDate ?? undefined,
      endDate: billingItems?.endDate ?? undefined,
      netPaymentTermLabel: formatNetPaymentTerm(
        quote.customer.netPaymentTerm ?? quote.customer.billingEntity?.netPaymentTerm,
        translate,
      ),
    }
  }

  const currencyOptions = useMemo(() => {
    if (!quote.customer.currency)
      return Object.values(CurrencyEnum).map((currencyType) => ({
        value: currencyType,
      }))
    return [
      {
        value: quote.customer.currency,
      },
    ]
  }, [quote.customer.currency])

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    validationLogic: revalidateLogic({ mode: 'change' }),
    validators: {
      onDynamic: editQuoteAsideSchema,
    },
  })

  // Auto-save billing items on date changes
  const hasInitializedRef = useRef(false)
  // Allow the use of updateQuoteVErsion in a memo without using eslint-disable-next-line
  const updateQuoteVersionRef = useRef(updateQuoteVersion)

  updateQuoteVersionRef.current = updateQuoteVersion

  const debouncedSaveBillingItems = useMemo(
    () =>
      debounce((startDate?: string, endDate?: string, currency?: CurrencyEnum) => {
        if (!versionId) return

        updateQuoteVersionRef.current(
          {
            id: versionId,
            billingItems: { startDate, endDate, currency },
          },
          false,
        )
      }, AUTO_SAVE_DELAY_MS),
    [versionId],
  )

  const startDate = useStore(form.store, (state) => state.values.startDate)
  const endDate = useStore(form.store, (state) => state.values.endDate)
  const currency = useStore(form.store, (state) => state.values.currency)
  const canSubmit = useStore(form.store, (state) => state.canSubmit)

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      return
    }
    if (!canSubmit) return

    debouncedSaveBillingItems(startDate, endDate, currency)
  }, [startDate, endDate, currency, canSubmit, debouncedSaveBillingItems])

  const gridClassName = 'grid grid-cols-[7.5rem_1fr] items-center gap-0 gap-y-2'

  return (
    <>
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
          {quote.customer.billingEntity && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID}
              >
                {translate('text_17436114971570doqrwuwhf0')}
              </Typography>
              <form.AppField name="billingEntityId">
                {(field) => (
                  <field.ComboBoxField
                    disabled
                    disableClearable
                    data={[
                      {
                        value: quote.customer.billingEntity.id,
                        label:
                          quote.customer.billingEntity.name || quote.customer.billingEntity.code,
                      },
                    ]}
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
          <form.AppField name="customerName">
            {(field) => <field.TextInputField disabled />}
          </form.AppField>

          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID}
          >
            {translate('text_632b4acf0c41206cbcb8c324')}
          </Typography>
          <form.AppField name="currency">
            {(field) => (
              <field.ComboBoxField
                disabled={hasCustomerCurrency}
                disableClearable
                data={currencyOptions}
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

          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_START_DATE_TEST_ID}
          >
            {translate('text_65201c5a175a4b0238abf29e')}
          </Typography>
          <form.AppField name="startDate">
            {(field) => <field.DatePickerField disabled={hasSubscription} placement="auto" />}
          </form.AppField>

          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_END_DATE_TEST_ID}
          >
            {translate('text_65201c5a175a4b0238abf2a0')}
          </Typography>
          <form.AppField name="endDate">
            {(field) => <field.DatePickerField placement="auto" />}
          </form.AppField>

          <Typography
            variant="caption"
            color="grey600"
            data-test={EDIT_QUOTE_ASIDE_PAYMENT_TERM_TEST_ID}
          >
            {translate('text_1778660219891rv2r5gjmklq')}
          </Typography>
          <form.AppField name="netPaymentTermLabel">
            {(field) => <field.TextInputField disabled />}
          </form.AppField>
        </div>
      </div>
    </>
  )
}

export default EditQuoteAside
