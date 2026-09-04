import {
  CurrencyEnum,
  RateCardBillingTimingEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'

import {
  buildCreatePricingInput,
  buildUpdatePricingInput,
  mapInvoiceFieldsToStrategy,
  mapStrategyToInvoiceFields,
  RATE_CARD_FORM_DEFAULTS,
  rateCardDrawerSchema,
} from '../constants'

describe('rate card constants', () => {
  it('defaults billing timing to arrears without a pricing unit', () => {
    expect(RATE_CARD_FORM_DEFAULTS.billingTiming).toBe(RateCardBillingTimingEnum.Arrears)
    expect(RATE_CARD_FORM_DEFAULTS.pricingUnit).toBeUndefined()
  })

  it('requires currency regardless of the pricing unit', () => {
    const base = { ...RATE_CARD_FORM_DEFAULTS, name: 'N', code: 'c', productId: 'pi_1' }

    expect(
      rateCardDrawerSchema.safeParse({ ...base, pricingUnit: undefined, currency: '' }).success,
    ).toBe(false)
    expect(
      rateCardDrawerSchema.safeParse({ ...base, pricingUnit: undefined, currency: 'USD' }).success,
    ).toBe(true)
    expect(
      rateCardDrawerSchema.safeParse({ ...base, pricingUnit: 'tokens', currency: '' }).success,
    ).toBe(false)
    expect(
      rateCardDrawerSchema.safeParse({ ...base, pricingUnit: 'tokens', currency: 'USD' }).success,
    ).toBe(true)
  })

  it('requires name', () => {
    expect(
      rateCardDrawerSchema.safeParse({
        ...RATE_CARD_FORM_DEFAULTS,
        currency: 'USD',
        code: 'c',
        productId: 'pi_1',
      }).success,
    ).toBe(false)
  })

  it('requires code', () => {
    expect(
      rateCardDrawerSchema.safeParse({
        ...RATE_CARD_FORM_DEFAULTS,
        currency: 'USD',
        name: 'N',
        productId: 'pi_1',
      }).success,
    ).toBe(false)
  })

  it('requires productId', () => {
    expect(
      rateCardDrawerSchema.safeParse({
        ...RATE_CARD_FORM_DEFAULTS,
        currency: 'USD',
        name: 'N',
        code: 'c',
      }).success,
    ).toBe(false)
  })

  it('omits the pricing unit code on create when there is none', () => {
    expect(buildCreatePricingInput({ pricingUnit: undefined, currency: CurrencyEnum.Usd })).toEqual(
      { currency: CurrencyEnum.Usd },
    )
    expect(buildCreatePricingInput({ pricingUnit: 'tokens', currency: CurrencyEnum.Usd })).toEqual({
      currency: CurrencyEnum.Usd,
      appliedPricingUnitCode: 'tokens',
    })
  })

  it('nulls the pricing unit code on update when there is none', () => {
    expect(buildUpdatePricingInput({ pricingUnit: undefined, currency: CurrencyEnum.Usd })).toEqual(
      {
        currency: CurrencyEnum.Usd,
        appliedPricingUnitCode: null,
      },
    )
    expect(buildUpdatePricingInput({ pricingUnit: 'tokens', currency: CurrencyEnum.Usd })).toEqual({
      currency: CurrencyEnum.Usd,
      appliedPricingUnitCode: 'tokens',
    })
  })

  it('maps invoicing strategy both ways', () => {
    expect(mapStrategyToInvoiceFields('invoiceable')).toEqual({
      displayOnInvoice: true,
      regroupPaidFees: null,
    })
    expect(mapStrategyToInvoiceFields('regroupPaidFees')).toEqual({
      displayOnInvoice: false,
      regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice,
    })
    expect(mapStrategyToInvoiceFields('none')).toEqual({
      displayOnInvoice: false,
      regroupPaidFees: null,
    })
    expect(mapInvoiceFieldsToStrategy({ displayOnInvoice: true, regroupPaidFees: null })).toBe(
      'invoiceable',
    )
    expect(
      mapInvoiceFieldsToStrategy({ regroupPaidFees: RateCardRegroupPaidFeesEnum.Invoice }),
    ).toBe('regroupPaidFees')
    expect(mapInvoiceFieldsToStrategy({ displayOnInvoice: false, regroupPaidFees: null })).toBe(
      'none',
    )
  })
})
