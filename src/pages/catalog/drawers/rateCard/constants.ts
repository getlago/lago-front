import { z } from 'zod'

import {
  CurrencyEnum,
  RateCardBillingTimingEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'

export const RATE_CARD_FORM_ID = 'rateCardForm'

export const RATE_CARD_FORM_SUBMIT_TEST_ID = 'rate-card-form-submit'

// Currency is mandatory on every rate card (`CreateRateCardInput.currency` is non-null),
// independent of whether a custom pricing unit is applied on top; `.superRefine` is what
// enforces it, since the field still carries the empty default until the user picks one.
export const rateCardDrawerSchema = z
  .object({
    name: z.string().min(1, 'text_1771342980565bx64zqq2mjs'),
    code: z.string().min(1, 'text_1771342994699klxu2paz7g9'),
    description: z.string(),
    productId: z.string().min(1, 'text_1771342994699klxu2paz7g8'),
    productFilterId: z.string(),
    pricingUnit: z.string().optional(),
    currency: z.union([z.nativeEnum(CurrencyEnum), z.literal('')]),
    billingTiming: z.nativeEnum(RateCardBillingTimingEnum),
    invoicingStrategy: z.enum(['invoiceable', 'regroupPaidFees', 'none']),
    proration: z.boolean(),
    walletTargetable: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.currency) {
      ctx.addIssue({
        code: 'custom',
        path: ['currency'],
        message: 'text_1784923399556hjnr43vhm5z',
      })
    }
  })

export type RateCardFormValues = z.infer<typeof rateCardDrawerSchema>

export type InvoicingStrategy = RateCardFormValues['invoicingStrategy']

export const RATE_CARD_FORM_DEFAULTS: RateCardFormValues = {
  name: '',
  code: '',
  description: '',
  productId: '',
  productFilterId: '',
  pricingUnit: undefined,
  currency: '',
  billingTiming: RateCardBillingTimingEnum.Arrears,
  invoicingStrategy: 'invoiceable',
  proration: false,
  walletTargetable: false,
}

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

type PricingFormValues = Pick<RateCardFormValues, 'pricingUnit'> & { currency: CurrencyEnum }

// Create omits an empty pricing unit, like the other empty optionals on `CreateRateCardInput`.
export const buildCreatePricingInput = (
  values: PricingFormValues,
): { currency: CurrencyEnum; appliedPricingUnitCode?: string } => ({
  currency: values.currency,
  ...(values.pricingUnit ? { appliedPricingUnitCode: values.pricingUnit } : {}),
})

// Update clears with an explicit null: undefined is stripped from the payload, so the
// previously applied unit would survive.
export const buildUpdatePricingInput = (
  values: PricingFormValues,
): { currency: CurrencyEnum; appliedPricingUnitCode: string | null } => ({
  currency: values.currency,
  appliedPricingUnitCode: values.pricingUnit ?? null,
})
