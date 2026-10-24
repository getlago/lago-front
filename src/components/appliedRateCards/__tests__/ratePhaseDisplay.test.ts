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
  const FROM_CONTRACT_START_KEY = 'text_1791838459983033k4czt8tl'
  const PREVIOUS_PHASE_END_KEY = 'text_1791838459983owffqxt3lov'
  const FOREVER_KEY = 'text_63c83a3476e46bc6ab9d85d6'
  const CYCLES_OF_KEY = 'text_1792805607611jqwgpebsjt0'
  const FOREVER_IN_KEY = 'text_1792805607611z33he0lep1w'
  const DAY_ADJECTIVE_KEY = 'text_1792805607611liqqm55m4tx'
  const CYCLE_COUNT_KEY = 'text_17928056076110dccmhrqkag'
  const DAY_DURATION_KEY = 'text_1791838459983pbylbvgfd34'

  it('GIVEN the first phase THEN it starts from the contract start', () => {
    expect(
      formatPhaseTimeline(
        { name: 'Intro', code: 'intro', position: 1, billingIntervalCycleCount: null },
        rate(1, RateCardRateBillingIntervalUnitEnum.Month),
        translate,
      ),
    ).toMatch(new RegExp(`^${FROM_CONTRACT_START_KEY}`))
  })

  it('GIVEN a later phase THEN it starts at the previous phase end', () => {
    expect(
      formatPhaseTimeline(
        { name: '', code: 'second', position: 2, billingIntervalCycleCount: null },
        rate(1, RateCardRateBillingIntervalUnitEnum.Month),
        translate,
      ),
    ).toMatch(new RegExp(`^${PREVIOUS_PHASE_END_KEY}`))
  })

  it('GIVEN a finite phase with a known interval THEN reads the cycle count of one interval', () => {
    const duration = translate(
      CYCLES_OF_KEY,
      { count: 3, duration: translate(DAY_DURATION_KEY, { count: 14 }, 14) },
      3,
    )

    expect(
      formatPhaseTimeline(
        { name: 'Intro', code: 'intro', position: 1, billingIntervalCycleCount: 3 },
        rate(14, RateCardRateBillingIntervalUnitEnum.Day),
        translate,
      ),
    ).toBe(translate(FROM_CONTRACT_START_KEY, { duration }))
  })

  it('GIVEN a forever phase with a known interval THEN reads forever in interval-long cycles', () => {
    const duration = translate(FOREVER_IN_KEY, {
      duration: translate(DAY_ADJECTIVE_KEY, { count: 14 }),
    })

    expect(
      formatPhaseTimeline(
        { name: '', code: 'second', position: 2, billingIntervalCycleCount: null },
        rate(14, RateCardRateBillingIntervalUnitEnum.Day),
        translate,
      ),
    ).toBe(translate(PREVIOUS_PHASE_END_KEY, { duration }))
  })

  it('GIVEN a finite phase without an interval THEN reads the bare cycle count', () => {
    const duration = translate(CYCLE_COUNT_KEY, { count: 3 }, 3)

    expect(
      formatPhaseTimeline(
        { name: 'Intro', code: 'intro', position: 1, billingIntervalCycleCount: 3 },
        undefined,
        translate,
      ),
    ).toBe(translate(FROM_CONTRACT_START_KEY, { duration }))
  })

  it('GIVEN a forever phase without an interval THEN reads forever', () => {
    expect(
      formatPhaseTimeline(
        { name: 'Intro', code: 'intro', position: 1, billingIntervalCycleCount: null },
        undefined,
        translate,
      ),
    ).toBe(translate(FROM_CONTRACT_START_KEY, { duration: FOREVER_KEY }))
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
