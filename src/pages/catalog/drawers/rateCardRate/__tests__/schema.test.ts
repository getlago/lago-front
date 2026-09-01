import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { RateCardRateBillingIntervalUnitEnum, RateCardRateModelEnum } from '~/generated/graphql'

import {
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
  VALUE_REQUIRED_KEY,
} from '../constants'
import { buildRateCardRateSchema, RateCardRateSchemaContext } from '../schema'

describe('buildRateCardRateSchema', () => {
  const validValues = {
    ...RATE_CARD_RATE_FORM_DEFAULTS,
    effectiveFrom: '2026-06-25T00:00:00.000Z',
    code: 'rate_06_25_2026',
    rateModel: RateCardRateModelEnum.Standard,
    properties: { amount: '10' },
  }

  const parse = (
    values: Record<string, unknown>,
    context: RateCardRateSchemaContext = {
      requiresConversionRate: false,
      effectiveFromBoundary: null,
    },
  ) => buildRateCardRateSchema(() => context).safeParse(values)

  const issuePathsAndMessages = (result: ReturnType<typeof parse>) =>
    result.success ? [] : result.error.issues.map((issue) => [issue.path.join('.'), issue.message])

  describe('GIVEN a fully valid rate', () => {
    describe('WHEN it is parsed', () => {
      it('THEN reports no issue', () => {
        expect(parse(validValues).success).toBe(true)
      })
    })
  })

  describe('GIVEN the effective date is missing', () => {
    describe('WHEN it is parsed', () => {
      it('THEN reports the required-field issue on effectiveFrom', () => {
        const result = parse({ ...validValues, effectiveFrom: '' })

        expect(issuePathsAndMessages(result)).toContainEqual(['effectiveFrom', VALUE_REQUIRED_KEY])
      })
    })
  })

  describe('GIVEN the effective date was cleared in the picker', () => {
    describe('WHEN it is parsed', () => {
      // The picker writes `undefined`, not ''. A strict `z.object` aborted here and showed
      // zod's untranslated "Required".
      it('THEN reports the translated required issue and still reports the other issues', () => {
        const result = parse({
          ...validValues,
          effectiveFrom: undefined,
          billingIntervalCount: '0',
        })

        expect(issuePathsAndMessages(result)).toContainEqual(['effectiveFrom', VALUE_REQUIRED_KEY])
        expect(issuePathsAndMessages(result)).toContainEqual([
          'billingIntervalCount',
          VALUE_REQUIRED_KEY,
        ])
      })
    })
  })

  // Regression: the picker publishes a typed pre-1970 date now, and a card with no
  // active rate yet has no boundary for the appendable check to fail against.
  describe('GIVEN the effective date is before the minimum supported date', () => {
    describe('WHEN it is parsed with no active-rate boundary', () => {
      it('THEN reports the unsupported-date issue on effectiveFrom', () => {
        const result = parse({ ...validValues, effectiveFrom: '0026-08-31T00:00:00.000Z' })

        expect(issuePathsAndMessages(result)).toEqual([['effectiveFrom', UNSUPPORTED_DATE_ERROR]])
      })
    })
  })

  describe('GIVEN the effective date is not after the active rate', () => {
    describe('WHEN it is parsed', () => {
      it('THEN blocks the submit with the after-active-rate issue', () => {
        const result = parse(
          { ...validValues, effectiveFrom: '2026-06-01T00:00:00.000Z' },
          {
            requiresConversionRate: false,
            effectiveFromBoundary: '2026-06-24T00:00:00.000Z',
          },
        )

        expect(issuePathsAndMessages(result)).toContainEqual([
          'effectiveFrom',
          RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
        ])
      })
    })
  })

  describe('GIVEN the code is empty', () => {
    describe('WHEN it is parsed', () => {
      it('THEN reports the required-field issue on code', () => {
        const result = parse({ ...validValues, code: '' })

        expect(issuePathsAndMessages(result)).toContainEqual(['code', VALUE_REQUIRED_KEY])
      })
    })
  })

  describe('GIVEN the billing interval count is not a positive integer', () => {
    describe('WHEN it is parsed', () => {
      it.each([
        ['zero', '0'],
        ['negative', '-1'],
        ['fractional', '1.5'],
        ['empty', ''],
      ])('THEN reports an issue for a %s count', (_, billingIntervalCount) => {
        const result = parse({ ...validValues, billingIntervalCount })

        expect(issuePathsAndMessages(result)).toContainEqual([
          'billingIntervalCount',
          VALUE_REQUIRED_KEY,
        ])
      })
    })
  })

  describe('GIVEN the card prices in a custom pricing unit', () => {
    const context: RateCardRateSchemaContext = {
      requiresConversionRate: true,
      effectiveFromBoundary: null,
    }

    describe('WHEN the conversion rate is missing or zero', () => {
      it.each([
        ['empty', ''],
        ['zero', '0'],
      ])('THEN reports an issue for a %s conversion rate', (_, conversionRate) => {
        const result = parse({ ...validValues, conversionRate }, context)

        expect(issuePathsAndMessages(result)).toContainEqual(['conversionRate', VALUE_REQUIRED_KEY])
      })
    })

    describe('WHEN a positive conversion rate is given', () => {
      it('THEN reports no conversion rate issue', () => {
        const result = parse({ ...validValues, conversionRate: '1.5' }, context)

        expect(
          issuePathsAndMessages(result).filter(([path]) => path === 'conversionRate'),
        ).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the card does not price in a custom pricing unit', () => {
    describe('WHEN the conversion rate is empty', () => {
      it('THEN reports no conversion rate issue', () => {
        const result = parse({ ...validValues, conversionRate: '' })

        expect(
          issuePathsAndMessages(result).filter(([path]) => path === 'conversionRate'),
        ).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the pricing properties are invalid for the selected model', () => {
    describe('WHEN a standard rate has no amount', () => {
      it('THEN reports an issue under the properties path', () => {
        const result = parse({ ...validValues, properties: {} })

        expect(
          issuePathsAndMessages(result).filter(([path]) => path.startsWith('properties')),
        ).not.toHaveLength(0)
      })
    })
  })

  describe('GIVEN the defaults the drawer opens with', () => {
    describe('WHEN they are parsed', () => {
      it('THEN the billing interval defaults are already valid', () => {
        expect(RATE_CARD_RATE_FORM_DEFAULTS.billingIntervalCount).toBe('1')
        expect(RATE_CARD_RATE_FORM_DEFAULTS.billingIntervalUnit).toBe(
          RateCardRateBillingIntervalUnitEnum.Month,
        )
      })
    })
  })
})
