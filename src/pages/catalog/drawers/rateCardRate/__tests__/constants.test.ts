import { Settings } from 'luxon'

import { intlFormatDateTime } from '~/core/timezone'
import {
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  TimezoneEnum,
} from '~/generated/graphql'

import {
  buildRateCardRateSchema,
  buildRateCodeFromEffectiveDate,
  formatEffectiveDate,
  isEffectiveFromAppendable,
  laterEffectiveFrom,
  RATE_CARD_RATE_DEPENDENT_QUERIES,
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
  RateCardRateSchemaContext,
  VALUE_REQUIRED_KEY,
} from '../constants'

describe('buildRateCodeFromEffectiveDate', () => {
  describe('GIVEN a picked effective date', () => {
    describe('WHEN the picker emits the UTC midnight of that day', () => {
      it('THEN derives a zero-padded rate_MM_DD_YYYY code', () => {
        expect(buildRateCodeFromEffectiveDate('2026-01-24T00:00:00.000Z')).toBe('rate_01_24_2026')
      })
    })

    describe('WHEN the ambient timezone is not UTC', () => {
      const originalDefaultZone = Settings.defaultZone

      beforeEach(() => {
        Settings.defaultZone = 'Asia/Tokyo'
      })

      // Restored here rather than after the assertion: Settings is module-global, so a
      // failing expectation would otherwise leave every later test in this file in Tokyo.
      afterEach(() => {
        Settings.defaultZone = originalDefaultZone
      })

      it('THEN still reads the day in UTC, matching the day the backend stores', () => {
        expect(buildRateCodeFromEffectiveDate('2026-01-24T00:00:00.000Z')).toBe('rate_01_24_2026')
      })
    })

    describe('WHEN there is no date yet', () => {
      it.each([
        ['an empty string', ''],
        ['an unparseable value', 'not-a-date'],
      ])('THEN returns undefined for %s', (_, value) => {
        expect(buildRateCodeFromEffectiveDate(value)).toBeUndefined()
      })
    })
  })
})

describe('formatEffectiveDate', () => {
  describe('GIVEN a stored effective date', () => {
    describe('WHEN it is rendered in an error message', () => {
      // Same rendering as the rates table and the rate overview, so the quoted boundary
      // matches the dates displayed next to it rather than reading as a US-format date.
      it('THEN formats it the way every other surface shows an effective date', () => {
        expect(formatEffectiveDate('2026-06-24T00:00:00.000Z')).toBe(
          intlFormatDateTime('2026-06-24T00:00:00.000Z', { timezone: TimezoneEnum.TzUtc }).date,
        )
      })

      it('THEN reads the day in UTC, not in the ambient zone', () => {
        expect(formatEffectiveDate('2026-06-24T00:00:00.000Z')).toBe('Jun 24, 2026')
      })
    })
  })
})

describe('laterEffectiveFrom', () => {
  const earlier = '2026-01-01T00:00:00.000Z'
  const later = '2026-06-24T00:00:00.000Z'

  describe('GIVEN two boundaries', () => {
    it.each([
      ['the second is later', earlier, later, later],
      ['the first is later', later, earlier, later],
      ['there is no first', null, later, later],
      ['there is no second', later, null, later],
      ['there is neither', null, null, null],
    ])('THEN keeps the later one WHEN %s', (_, a, b, expected) => {
      expect(laterEffectiveFrom(a, b)).toBe(expected)
    })
  })
})

describe('RATE_CARD_RATE_DEPENDENT_QUERIES', () => {
  describe('GIVEN a rate was deleted', () => {
    describe('WHEN the list refetches', () => {
      // Its own details query would answer 404, which is why the delete flow evicts from the
      // cache instead. Adding it here would reintroduce the delayed error toast.
      it('THEN the rate details query is not among the refetched ones', () => {
        expect(RATE_CARD_RATE_DEPENDENT_QUERIES).not.toContain('getRateCardRateForDetails')
      })

      it('THEN every surface counting rates is refetched', () => {
        expect(RATE_CARD_RATE_DEPENDENT_QUERIES).toEqual(
          expect.arrayContaining(['rateCardRates', 'getRateCardForDetails', 'rateCards']),
        )
      })
    })
  })
})

describe('isEffectiveFromAppendable', () => {
  const boundary = '2026-06-24T00:00:00.000Z'

  describe('GIVEN the card already has an effective rate', () => {
    describe('WHEN the new date is compared against it', () => {
      it.each([
        ['strictly after', '2026-06-25T00:00:00.000Z', true],
        ['the very same instant', boundary, false],
        ['before', '2026-01-01T00:00:00.000Z', false],
      ])('THEN a date %s the boundary returns %s', (_, value, expected) => {
        expect(isEffectiveFromAppendable(value, boundary)).toBe(expected)
      })
    })
  })

  describe('GIVEN the card has no effective rate yet', () => {
    describe('WHEN any date is checked', () => {
      it('THEN accepts it', () => {
        expect(isEffectiveFromAppendable('2020-01-01T00:00:00.000Z', null)).toBe(true)
      })
    })
  })

  describe('GIVEN no date has been picked', () => {
    describe('WHEN it is checked', () => {
      it('THEN accepts it so the required-field error is the one that surfaces', () => {
        expect(isEffectiveFromAppendable('', boundary)).toBe(true)
      })
    })
  })
})

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
      // The date picker writes `undefined`, not ''. A strict `z.object` aborted here, so the
      // field showed zod's untranslated "Required" and every other issue below disappeared.
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
