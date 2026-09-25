import { UsageAttributionTypeRoleEnum } from '~/generated/graphql'

import {
  buildCreateUsageAttributionTypeInput,
  GOVERNANCE_ENTITY_FORM_DEFAULTS,
  GovernanceEntityFormValues,
  governanceEntityValidationSchema,
  MAX_ATTRIBUTION_KEYS,
} from '../validationSchema'

const keys = (count: number): GovernanceEntityFormValues['attributionKeys'] =>
  Array.from({ length: count }, (_, index) => ({ value: `key_${index}` }))

const validValues = (
  overrides: Partial<GovernanceEntityFormValues> = {},
): GovernanceEntityFormValues => ({
  ...GOVERNANCE_ENTITY_FORM_DEFAULTS,
  name: 'Department',
  code: 'department',
  role: UsageAttributionTypeRoleEnum.Flat,
  attributionKeys: keys(1),
  ...overrides,
})

const errorPaths = (values: GovernanceEntityFormValues): string[] => {
  const result = governanceEntityValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('governanceEntityValidationSchema', () => {
  describe('GIVEN valid values', () => {
    it.each([
      ['a single key', validValues()],
      [
        `${MAX_ATTRIBUTION_KEYS} keys`,
        validValues({ attributionKeys: keys(MAX_ATTRIBUTION_KEYS) }),
      ],
      ['an empty name', validValues({ name: '' })],
      [
        'a hierarchical role with a parent',
        validValues({ role: UsageAttributionTypeRoleEnum.Hierarchical, parentId: 'p1' }),
      ],
    ])('THEN should accept %s', (_, values) => {
      expect(errorPaths(values)).toEqual([])
    })
  })

  describe('GIVEN invalid values', () => {
    it.each([
      ['no attribution key', validValues({ attributionKeys: [] }), 'attributionKeys'],
      ['a blank key', validValues({ attributionKeys: [{ value: ' ' }] }), 'attributionKeys'],
      [
        'more keys than the maximum',
        validValues({ attributionKeys: keys(MAX_ATTRIBUTION_KEYS + 1) }),
        'attributionKeys',
      ],
      [
        'a key longer than 255 characters',
        validValues({ attributionKeys: [{ value: 'a'.repeat(256) }] }),
        'attributionKeys',
      ],
      ['an empty code', validValues({ code: '' }), 'code'],
      ['a name longer than 255 characters', validValues({ name: 'a'.repeat(256) }), 'name'],
      ['a missing role', validValues({ role: undefined }), 'role'],
    ])('THEN should reject %s on the right field', (_, values, path) => {
      expect(errorPaths(values)).toEqual([path])
    })
  })
})

describe('buildCreateUsageAttributionTypeInput', () => {
  describe('GIVEN a hierarchical entity with a parent', () => {
    it('THEN should map every field', () => {
      expect(
        buildCreateUsageAttributionTypeInput(
          validValues({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            parentId: 'p1',
            attributionKeys: [{ value: 'department_id' }],
          }),
        ),
      ).toEqual({
        name: 'Department',
        code: 'department',
        role: UsageAttributionTypeRoleEnum.Hierarchical,
        parentId: 'p1',
        attributionKeys: ['department_id'],
      })
    })
  })

  describe('GIVEN a flat entity with a stale parent', () => {
    it('THEN should not send the parent', () => {
      const input = buildCreateUsageAttributionTypeInput(validValues({ parentId: 'p1' }))

      expect(input).not.toHaveProperty('parentId')
    })
  })

  describe('GIVEN keys with surrounding spaces', () => {
    it('THEN should send them trimmed', () => {
      const input = buildCreateUsageAttributionTypeInput(
        validValues({ attributionKeys: [{ value: ' a ' }] }),
      )

      expect(input?.attributionKeys).toEqual(['a'])
    })
  })

  describe('GIVEN an empty name', () => {
    it('THEN should omit the name', () => {
      const input = buildCreateUsageAttributionTypeInput(validValues({ name: '' }))

      expect(input).not.toHaveProperty('name')
    })
  })

  describe('GIVEN a description', () => {
    it.each([
      ['a filled description', 'Engineering teams', 'Engineering teams'],
      ['a blank description', '   ', undefined],
      ['an empty description', '', undefined],
    ])('THEN should handle %s', (_, description, expected) => {
      const input = buildCreateUsageAttributionTypeInput(validValues({ description }))

      expect(input?.description).toBe(expected)
    })
  })

  describe('GIVEN no role', () => {
    it('THEN should return undefined', () => {
      expect(buildCreateUsageAttributionTypeInput(validValues({ role: undefined }))).toBeUndefined()
    })
  })
})
