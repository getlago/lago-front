import {
  CurrencyEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  formatConversionRateAmount,
  formatPhaseDuration,
  formatPhaseTimeline,
  formatRateBillingInterval,
  formatRatePhaseName,
  formatSpendingMinimum,
  getRateHistoryPath,
} from '../ratePhaseDisplay'

const translate: TranslateFunc = (key, data, plural) =>
  `${key}${data ? `|${JSON.stringify(data)}` : ''}${plural !== undefined ? `|${plural}` : ''}`

const rate = (
  billingIntervalCount: number,
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum,
): RateOverrideInput => ({
  rateModel: RateCardRateModelEnum.Standard,
  rateProperties: {},
  billingIntervalCount,
  billingIntervalUnit,
})

describe('formatPhaseDuration', () => {
  it('GIVEN no cycle count THEN reads forever', () => {
    expect(
      formatPhaseDuration(null, rate(1, RateCardRateBillingIntervalUnitEnum.Month), translate),
    ).toBe('text_63c83a3476e46bc6ab9d85d6')
  })

  it('GIVEN cycles of a multi-day interval THEN multiplies them without converting the unit', () => {
    expect(
      formatPhaseDuration(1, rate(14, RateCardRateBillingIntervalUnitEnum.Day), translate),
    ).toBe('text_1791838459983pbylbvgfd34|{"count":14}|14')
    expect(
      formatPhaseDuration(2, rate(1, RateCardRateBillingIntervalUnitEnum.Week), translate),
    ).toBe('text_17918384599834l3c40rdguv|{"count":2}|2')
  })

  it('GIVEN no rate to read the interval from THEN falls back to the cycle count', () => {
    expect(formatPhaseDuration(3, undefined, translate)).toBe('3 text_1791485670326auwsxq3x83b')
  })
})

describe('formatPhaseTimeline', () => {
  it('GIVEN the first phase THEN it starts from the contract start', () => {
    expect(
      formatPhaseTimeline(
        { name: 'Intro', code: 'intro', position: 1, billingIntervalCycleCount: null },
        rate(1, RateCardRateBillingIntervalUnitEnum.Month),
        translate,
      ),
    ).toBe('text_1791838459983033k4czt8tl|{"duration":"text_63c83a3476e46bc6ab9d85d6"}')
  })

  it('GIVEN a later phase THEN it starts at the previous phase end', () => {
    expect(
      formatPhaseTimeline(
        { name: '', code: 'second', position: 2, billingIntervalCycleCount: null },
        rate(1, RateCardRateBillingIntervalUnitEnum.Month),
        translate,
      ),
    ).toMatch(/^text_1791838459983owffqxt3lov/)
  })
})

describe('formatRateBillingInterval', () => {
  it('GIVEN a 14 day interval THEN wraps the duration in the "Every" copy', () => {
    expect(
      formatRateBillingInterval(rate(14, RateCardRateBillingIntervalUnitEnum.Day), translate),
    ).toBe(
      `text_17918384599832tqq2f0ezu9|${JSON.stringify({
        duration: 'text_1791838459983pbylbvgfd34|{"count":14}|14',
      })}`,
    )
  })

  it('GIVEN no interval on the rate THEN defaults to 1 month', () => {
    const noInterval: RateOverrideInput = {
      rateModel: RateCardRateModelEnum.Standard,
      rateProperties: {},
    }

    expect(formatRateBillingInterval(noInterval, translate)).toContain(
      'text_1791838459983q6n44o5fdd4|{\\"count\\":1}|1',
    )
  })
})

describe('formatSpendingMinimum', () => {
  const rateWithMinimum = (minAmountCents: string): RateOverrideInput => ({
    ...rate(1, RateCardRateBillingIntervalUnitEnum.Month),
    minAmountCents,
  })

  it('GIVEN no minimum THEN returns a dash', () => {
    expect(formatSpendingMinimum(rateWithMinimum('0'), CurrencyEnum.Usd, undefined)).toBe('-')
  })

  it('GIVEN a minimum in cents THEN formats it in the currency', () => {
    expect(formatSpendingMinimum(rateWithMinimum('500'), CurrencyEnum.Usd, undefined)).toBe('$5.00')
  })

  it('GIVEN a pricing unit THEN formats it in that unit', () => {
    expect(formatSpendingMinimum(rateWithMinimum('500'), CurrencyEnum.Usd, 'CR')).toBe('5 CR')
  })
})

describe('formatConversionRateAmount', () => {
  it('GIVEN an amount THEN formats it as a currency symbol amount', () => {
    expect(formatConversionRateAmount(1, CurrencyEnum.Usd)).toBe('$1.00')
  })
})

describe('formatRatePhaseName', () => {
  it('GIVEN a named phase THEN returns the name', () => {
    expect(formatRatePhaseName({ name: 'Intro', position: 1 }, translate)).toBe('Intro')
  })

  it('GIVEN a nameless phase THEN falls back to the position copy', () => {
    expect(formatRatePhaseName({ name: null, position: 3 }, translate)).toBe(
      'text_1792503533806fhiu57zr6an|{"position":3}',
    )
  })

  it('GIVEN an empty name THEN falls back to the position copy', () => {
    expect(formatRatePhaseName({ name: '', position: 2 }, translate)).toBe(
      'text_1792503533806fhiu57zr6an|{"position":2}',
    )
  })
})

describe('getRateHistoryPath', () => {
  it('GIVEN an organization slug THEN points to the rate card rates tab of that org', () => {
    expect(getRateHistoryPath('rc-1', 'acme')).toBe('/acme/product-catalog/rate-cards/rc-1/rates')
  })
})
