import { chargeModelLookupTranslation } from '~/core/constants/form'
import { RateCardRateModelEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  DYNAMIC_RATE_KEY,
  formatActiveRate,
  FROM_TO_RATE_KEY,
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
  [RateCardRateModelEnum.Dynamic]: 'Dynamic pricing',
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
  [FROM_TO_RATE_KEY]: 'From {{min}} to {{max}}',
  [DYNAMIC_RATE_KEY]: 'Price defined in event',
}

const translate = ((key: string, variables?: Record<string, unknown>) => {
  const template = TRANSLATIONS[key]

  if (!template) return key

  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(variables?.[name]))
}) as TranslateFunc

describe('formatActiveRate', () => {
  it('returns only the empty label (no secondary) when there is no active rate', () => {
    expect(formatActiveRate(null, { translate })).toEqual({ primary: NO_ACTIVE_RATE_KEY })
    expect(formatActiveRate(undefined, { translate })).toEqual({ primary: NO_ACTIVE_RATE_KEY })
  })

  it('formats a standard rate as amount per unit + the model label', () => {
    const { primary, secondary } = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Standard, rateProperties: { amount: '10' } },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('10')
    expect(primary.toLowerCase()).toContain('unit')
    expect(secondary).toBe('Standard')
  })

  it('formats a package rate as amount per package size + the model label', () => {
    const { primary, secondary } = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Package,
        rateProperties: { amount: '30', packageSize: 100 },
      },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('30')
    expect(primary).toContain('100')
    expect(primary.toLowerCase()).toContain('units')
    expect(secondary).toBe('Package')
  })

  it('formats a percentage rate as a rate percentage + the model label', () => {
    const { primary, secondary } = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Percentage, rateProperties: { rate: '1.5' } },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('1.5')
    expect(primary).toContain('%')
    expect(secondary).toBe('Percentage')
  })

  it('formats graduated as a first-to-last amount range + a tier-count model label', () => {
    const { primary, secondary } = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Graduated,
        rateProperties: {
          graduatedRanges: [
            { perUnitAmount: '10' },
            { perUnitAmount: '50' },
            { perUnitAmount: '100' },
          ],
        },
      },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('From')
    expect(primary).toContain('10')
    expect(primary).toContain('100')
    expect(secondary).toBe('Graduated (3 tiers)')
  })

  it('formats graduated percentage as a first-to-last percentage range + a tier-count label', () => {
    const { primary, secondary } = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.GraduatedPercentage,
        rateProperties: { graduatedPercentageRanges: [{ rate: '10' }, { rate: '5' }] },
      },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('From')
    expect(primary).toContain('10%')
    expect(primary).toContain('5%')
    expect(secondary).toBe('Graduated percentage (2 tiers)')
  })

  it('formats volume as a first-to-last amount range + a tier-count model label', () => {
    const { primary, secondary } = formatActiveRate(
      {
        rateModel: RateCardRateModelEnum.Volume,
        rateProperties: {
          volumeRanges: [
            { perUnitAmount: '10' },
            { perUnitAmount: '8' },
            { perUnitAmount: '6' },
            { perUnitAmount: '5' },
          ],
        },
      },
      { translate, currency: 'USD' as never },
    )

    expect(primary).toContain('From')
    expect(secondary).toBe('Volume (4 tiers)')
  })

  it('formats dynamic pricing with a copy value + the model label', () => {
    const { primary, secondary } = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Dynamic, rateProperties: {} },
      { translate },
    )

    expect(primary).toBe('Price defined in event')
    expect(secondary).toBe('Dynamic pricing')
  })

  it('formats custom pricing as the model label alone (no secondary)', () => {
    const result = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Custom, rateProperties: {} },
      { translate },
    )

    expect(result).toEqual({ primary: 'Custom' })
  })

  it('appends the applied pricing unit code instead of a fiat currency', () => {
    const { primary } = formatActiveRate(
      { rateModel: RateCardRateModelEnum.Standard, rateProperties: { amount: '10' } },
      { translate, appliedPricingUnitCode: 'credits' },
    )

    expect(primary).toContain('credits')
    expect(primary).not.toContain('$')
  })
})
