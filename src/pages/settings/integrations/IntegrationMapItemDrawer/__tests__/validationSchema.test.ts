import { z } from 'zod'

import {
  refineIntegrationMapItemEntries,
  refineRequiredIntegrationMapItemFields,
} from '../validationSchema'

const entrySchema = z.object({ first: z.string(), second: z.string(), hidden: z.string() })

const requiredFieldsSchema = z
  .record(z.string(), entrySchema)
  .superRefine(refineRequiredIntegrationMapItemFields(['first', 'second']))

const customRulesSchema = z.record(z.string(), entrySchema).superRefine(
  refineIntegrationMapItemEntries({
    isFilled: (entry) => !!entry.first,
    getMissingFields: (entry) => (entry.first === entry.second ? [] : ['second']),
  }),
)

const getIssuePaths = (schema: z.ZodType, values: unknown): Array<string> => {
  const result = schema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => issue.path.join('.'))
}

const entry = (
  overrides: Partial<z.infer<typeof entrySchema>> = {},
): z.infer<typeof entrySchema> => ({
  first: '',
  second: '',
  hidden: '',
  ...overrides,
})

describe('refineRequiredIntegrationMapItemFields', () => {
  describe('GIVEN every entry is fully empty', () => {
    describe('WHEN validating', () => {
      it('THEN should pass so the mapping can be cleared', () => {
        expect(getIssuePaths(requiredFieldsSchema, { default: entry(), be1: entry() })).toEqual([])
      })
    })
  })

  describe('GIVEN every required field of an entry is filled', () => {
    describe('WHEN validating', () => {
      it('THEN should pass', () => {
        expect(
          getIssuePaths(requiredFieldsSchema, { default: entry({ first: 'a', second: 'b' }) }),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN an entry is partially filled', () => {
    describe('WHEN validating', () => {
      it.each([
        ['only first filled', entry({ first: 'a' }), ['be1.second']],
        ['only second filled', entry({ second: 'b' }), ['be1.first']],
      ])('THEN should flag the missing field when %s', (_, partialEntry, expectedPaths) => {
        expect(
          getIssuePaths(requiredFieldsSchema, { default: entry(), be1: partialEntry }),
        ).toEqual(expectedPaths)
      })
    })
  })

  describe('GIVEN several entries are partially filled', () => {
    describe('WHEN validating', () => {
      it('THEN should flag each of them independently', () => {
        expect(
          getIssuePaths(requiredFieldsSchema, {
            default: entry({ first: 'a' }),
            be1: entry(),
            be2: entry({ second: 'b' }),
          }),
        ).toEqual(['default.second', 'be2.first'])
      })
    })
  })

  describe('GIVEN an entry whose only values are outside the required fields', () => {
    describe('WHEN validating', () => {
      // Regression: a hidden value used to make the entry count as filled, so every required
      // field was flagged and a Netsuite tax mapping carrying external ids could not be deleted.
      it('THEN should pass so the mapping can be cleared', () => {
        expect(
          getIssuePaths(requiredFieldsSchema, { default: entry({ hidden: 'seeded' }) }),
        ).toEqual([])
      })
    })
  })
})

describe('refineIntegrationMapItemEntries', () => {
  describe('GIVEN custom rules', () => {
    describe('WHEN an entry is not filled according to isFilled', () => {
      it('THEN should skip it without calling getMissingFields', () => {
        expect(getIssuePaths(customRulesSchema, { default: entry({ second: 'b' }) })).toEqual([])
      })
    })

    describe('WHEN a filled entry reports missing fields', () => {
      it('THEN should flag them under the billing entity key', () => {
        expect(getIssuePaths(customRulesSchema, { be1: entry({ first: 'a' }) })).toEqual([
          'be1.second',
        ])
      })
    })

    describe('WHEN a filled entry reports no missing field', () => {
      it('THEN should pass', () => {
        expect(
          getIssuePaths(customRulesSchema, { be1: entry({ first: 'a', second: 'a' }) }),
        ).toEqual([])
      })
    })
  })
})
