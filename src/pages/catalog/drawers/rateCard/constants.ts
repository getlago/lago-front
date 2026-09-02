import { z } from 'zod'

import {
  CurrencyEnum,
  RateCardBillingTimingEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'

// Reused from other drawers (`pnpm translations:add`) rather than hand-written.
const NAME_REQUIRED_KEY = 'text_1771342980565bx64zqq2mjs' // "Name is required"
const CODE_REQUIRED_KEY = 'text_1771342994699klxu2paz7g9' // "Code is required"
const PRODUCT_ITEM_REQUIRED_KEY = 'text_1771342994699klxu2paz7g8' // "Field is required"
const CURRENCY_REQUIRED_KEY = 'text_1784923399556hjnr43vhm5z' // "Currency is required"

export const RATE_CARD_FORM_ID = 'rateCardForm'

export const RATE_CARD_FORM_SUBMIT_TEST_ID = 'rate-card-form-submit'

// Sentinel value of `pricingUnit` meaning "priced in the organization's currency"
// rather than in a custom pricing unit (whose code would be the value instead).
export const PRICING_UNIT_CURRENCY_OPTION = 'currency'

export type InvoicingStrategy = 'invoiceable' | 'regroupPaidFees' | 'none'

export const RATE_CARD_FORM_DEFAULTS = {
  name: '',
  code: '',
  description: '',
  productId: '',
  productFilterId: '',
  // 'currency' | pricing unit code
  pricingUnit: PRICING_UNIT_CURRENCY_OPTION as string,
  currency: '' as CurrencyEnum | '',
  billingTiming: RateCardBillingTimingEnum.Arrears,
  invoicingStrategy: 'invoiceable' as InvoicingStrategy,
  proration: false,
  walletTargetable: false,
}

export type RateCardFormValues = typeof RATE_CARD_FORM_DEFAULTS

// Every `RateCardFormValues` field is declared so the schema's inferred type matches
// `RateCardFormValues` with no cast (mirrors the sibling drawer schemas). Currency is
// mandatory on every rate card (the schema's `RateCard.currency` / `CreateRateCardInput.currency`
// are both non-null), independent of whether a custom pricing unit is also applied; the
// `.superRefine` enforces it since the field type still allows the empty default.
export const rateCardDrawerSchema = z
  .object({
    name: z.string().min(1, NAME_REQUIRED_KEY),
    code: z.string().min(1, CODE_REQUIRED_KEY),
    description: z.string(),
    productId: z.string().min(1, PRODUCT_ITEM_REQUIRED_KEY),
    productFilterId: z.string(),
    pricingUnit: z.string(),
    currency: z.union([z.nativeEnum(CurrencyEnum), z.literal('')]),
    billingTiming: z.nativeEnum(RateCardBillingTimingEnum),
    invoicingStrategy: z.enum(['invoiceable', 'regroupPaidFees', 'none']),
    proration: z.boolean(),
    walletTargetable: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currency'],
        message: CURRENCY_REQUIRED_KEY,
      })
    }
  })

export const mapStrategyToInvoiceFields = (
  strategy: InvoicingStrategy,
): { displayOnInvoice: boolean; regroupPaidFees: RateCardRegroupPaidFeesEnum | null } => {
  switch (strategy) {
    case 'regroupPaidFees':
      return { displayOnInvoice: false, regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice }
    case 'none':
      return { displayOnInvoice: false, regroupPaidFees: null }
    default:
      return { displayOnInvoice: true, regroupPaidFees: null }
  }
}

export const mapInvoiceFieldsToStrategy = (args: {
  displayOnInvoice?: boolean | null
  regroupPaidFees?: RateCardRegroupPaidFeesEnum | null
}): InvoicingStrategy => {
  if (args.regroupPaidFees === RateCardRegroupPaidFeesEnum.Invoice) return 'regroupPaidFees'
  if (args.displayOnInvoice) return 'invoiceable'
  return 'none'
}

// Currency is always sent (mandatory on the input); a custom pricing unit is an
// optional add-on layered on top of it, so both keys can be present together.
export const buildPricingInput = (
  values: Pick<RateCardFormValues, 'pricingUnit' | 'currency'>,
): { currency: CurrencyEnum; appliedPricingUnitCode?: string } => ({
  currency: values.currency as CurrencyEnum,
  ...(values.pricingUnit === PRICING_UNIT_CURRENCY_OPTION
    ? {}
    : { appliedPricingUnitCode: values.pricingUnit }),
})
