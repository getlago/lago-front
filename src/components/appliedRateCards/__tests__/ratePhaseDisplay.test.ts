import {
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { formatPhaseDuration, formatPhaseTimeline } from '../ratePhaseDisplay'

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
