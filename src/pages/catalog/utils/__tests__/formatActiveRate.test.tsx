import { chargeModelLookupTranslation } from '~/core/constants/form'
import { RateCardRateModelEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  formatActiveRate,
  NO_ACTIVE_RATE_KEY,
  PACKAGE_RATE_KEY,
  PERCENTAGE_RATE_KEY,
  STANDARD_RATE_KEY,
  TIERED_RATE_KEY,
} from '../formatActiveRate'

// Human-readable English copy for each RateCardRateModelEnum member, matching the
// values `chargeModelLookupTranslation` resolves to in translations/base.json.
const MODEL_LABELS: Record<RateCardRateModelEnum, string> = {
  [RateCardRateModelEnum.Standard]: 'Standard',
  [RateCardRateModelEnum.Package]: 'Package',
  [RateCardRateModelEnum.Percentage]: 'Percentage',
  [RateCardRateModelEnum.Graduated]: 'Graduated',
  [RateCardRateModelEnum.GraduatedPercentage]: 'Graduated percentage',
  [RateCardRateModelEnum.Volume]: 'Volume',
  [RateCardRateModelEnum.Custom]: 'Custom',
  [RateCardRateModelEnum.Dynamic]: 'Dynamic',
}

// Maps every translation key the util reaches to its real English template, then
// interpolates {{var}} placeholders - mirroring the mapping-mock pattern used in
// src/core/utils/__tests__/subscriptionUtils.test.ts. Unknown keys fall through to
// the raw key, matching the real translate() behavior for the empty-state assertion.
const TRANSLATIONS: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(RateCardRateModelEnum).map((model) => [
      chargeModelLookupTranslation[model],
      MODEL_LABELS[model],
    ]),
  ),
  [STANDARD_RATE_KEY]: '{{amount}} per unit',
  [PACKAGE_RATE_KEY]: '{{amount}} per {{count}} units',
  [PERCENTAGE_RATE_KEY]: '{{rate}}%',
  [TIERED_RATE_KEY]: '{{label}} ({{count}} tiers)',
}

const translate = ((key: string, variables?: Record<string, unknown>) => {
  const template = TRANSLATIONS[key]

  if (!template) return key

  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(variables?.[name]))
}) as TranslateFunc

describe('formatActiveRate', () => {
  it('returns the empty label when there is no active rate', () => {
    expect(formatActiveRate(null, { translate })).toBe(NO_ACTIVE_RATE_KEY)
    expect(formatActiveRate(undefined, { translate })).toBe(NO_ACTIVE_RATE_KEY)
  })

  it('formats a standard rate as amount per unit', () => {
    const out = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Standard, rateProperties: { amount: '10' } },
      { translate, currency: 'USD' as never },
    )

    expect(out).toContain('10')
    expect(out.toLowerCase()).toContain('unit')
  })

  it('formats a package rate as amount per package size', () => {
    const out = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Package,
        rateProperties: { amount: '30', packageSize: 100 },
      },
      { translate, currency: 'USD' as never },
    )

    expect(out).toContain('30')
    expect(out).toContain('100')
    expect(out.toLowerCase()).toContain('units')
  })

  it('formats a percentage rate as a rate percentage', () => {
    const out = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Percentage, rateProperties: { rate: '1.5' } },
      { translate, currency: 'USD' as never },
    )

    expect(out).toContain('1.5')
    expect(out).toContain('%')
  })

  it('labels graduated with a tier count', () => {
    const out = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Graduated,
        rateProperties: { graduatedRanges: [{}, {}, {}] },
      },
      { translate, currency: 'USD' as never },
    )

    expect(out.toLowerCase()).toContain('graduated')
    expect(out).toContain('3')
  })

  it('labels graduated percentage with a tier count', () => {
    const out = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.GraduatedPercentage,
        rateProperties: { graduatedPercentageRanges: [{}, {}] },
      },
      { translate, currency: 'USD' as never },
    )

    expect(out.toLowerCase()).toContain('graduated percentage')
    expect(out).toContain('2')
  })

  it('labels volume with a tier count', () => {
    const out = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Volume,
        rateProperties: { volumeRanges: [{}, {}, {}, {}] },
      },
      { translate, currency: 'USD' as never },
    )

    expect(out.toLowerCase()).toContain('volume')
    expect(out).toContain('4')
  })

  it('labels dynamic pricing without an amount', () => {
    const out = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Dynamic, rateProperties: {} },
      { translate },
    )

    expect(out.toLowerCase()).toContain('dynamic')
  })

  it('labels custom pricing without an amount', () => {
    const out = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Custom, rateProperties: {} },
      { translate },
    )

    expect(out.toLowerCase()).toContain('custom')
  })

  it('appends the applied pricing unit code instead of a fiat currency', () => {
    const out = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Standard, rateProperties: { amount: '10' } },
      { translate, appliedPricingUnitCode: 'credits' },
    )

    expect(out).toContain('credits')
    expect(out).not.toContain('$')
  })
})
