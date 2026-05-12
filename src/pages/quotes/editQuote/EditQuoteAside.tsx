import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { TextInput } from '~/components/form/TextInput'
import { QuoteDetailItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getQuoteOrderTypeTranslationKey } from '../common/getQuoteOrderTypeTranslationKey'

export const EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID = 'edit-quote-aside-quote-type'
export const EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID = 'edit-quote-aside-customer'
export const EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID = 'edit-quote-aside-billing-entity'
export const EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID = 'edit-quote-aside-subscription'
export const EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID = 'edit-quote-aside-currency'

interface EditQuoteAsideProps {
  quote: QuoteDetailItemFragment | null | undefined
}

const EditQuoteAside = ({ quote }: EditQuoteAsideProps) => {
  const { translate } = useInternationalization()

  if (!quote) return null

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
          <TextInput disabled value={translate(getQuoteOrderTypeTranslationKey(quote.orderType))} />
          {quote.customer.billingEntity && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_BILLING_ENTITY_INPUT_TEST_ID}
              >
                {translate('text_17436114971570doqrwuwhf0')}
              </Typography>
              <ComboBox
                disabled
                disableClearable
                data={[
                  {
                    value: quote.customer.billingEntity.id,
                    label: quote.customer.billingEntity.name || quote.customer.billingEntity.code,
                  },
                ]}
                value={quote.customer.billingEntity.id}
                onChange={() => {}}
              />
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
          <TextInput disabled value={quote.customer.name ?? ''} />
          {quote.customer.currency && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_CURRENCY_INPUT_TEST_ID}
              >
                {translate('text_632b4acf0c41206cbcb8c324')}
              </Typography>
              <ComboBox
                disabled
                disableClearable
                data={[
                  {
                    value: quote.customer.currency,
                  },
                ]}
                value={quote.customer.currency}
                onChange={() => {}}
              />
            </>
          )}
          {quote.subscription && (
            <>
              <Typography
                variant="caption"
                color="grey600"
                data-test={EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID}
              >
                {translate('text_1776238919927d6e7f8g9h0i')}
              </Typography>
              <TextInput
                disabled
                value={`${quote.subscription.plan.name} - ${quote.subscription.externalId}`}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default EditQuoteAside
