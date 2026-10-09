import { z } from 'zod'

import { refineIntegrationMapItemEntries } from '../validationSchema'

const schema = z
  .record(z.string(), z.object({ first: z.string(), second: z.string() }))
  .superRefine(
    refineIntegrationMapItemEntries((entry) =>
      (['first', 'second'] as const).filter((field) => !entry[field]),
    ),
  )

const getIssuePaths = (values: unknown): Array<string> => {
  const result = schema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('refineIntegrationMapItemEntries', () => {
  describe('GIVEN every entry is fully empty', () => {
    describe('WHEN validating', () => {
      it('THEN should pass so the mapping can be cleared', () => {
        expect(
          getIssuePaths({ default: { first: '', second: '' }, be1: { first: '', second: '' } }),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN every entry is fully filled', () => {
    describe('WHEN validating', () => {
      it('THEN should pass', () => {
        expect(getIssuePaths({ default: { first: 'a', second: 'b' } })).toEqual([])
      })
    })
  })

  describe('GIVEN an entry is partially filled', () => {
    describe('WHEN validating', () => {
      it.each([
        ['only first filled', { first: 'a', second: '' }, ['be1.second']],
        ['only second filled', { first: '', second: 'b' }, ['be1.first']],
      ])('THEN should flag the missing field when %s', (_, entry, expectedPaths) => {
        expect(getIssuePaths({ default: { first: '', second: '' }, be1: entry })).toEqual(
          expectedPaths,
        )
      })
    })
  })

  describe('GIVEN several entries are partially filled', () => {
    describe('WHEN validating', () => {
      it('THEN should flag each of them independently', () => {
        expect(
          getIssuePaths({
            default: { first: 'a', second: '' },
            be1: { first: '', second: '' },
            be2: { first: '', second: 'b' },
          }),
        ).toEqual(['default.second', 'be2.first'])
      })
    })
  })
})
