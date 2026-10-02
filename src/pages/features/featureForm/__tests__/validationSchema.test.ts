import { PrivilegeValueTypeEnum } from '~/generated/graphql'

import { emptyFeatureDefaultValues, featureValidationSchema } from '../validationSchema'

const errorPaths = (values: unknown): string[] => {
  const result = featureValidationSchema.safeParse(values)

  if (result.success) return []

  return [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].sort()
}

const aPrivilege = (overrides: Record<string, unknown> = {}) => ({
  name: 'Seats',
  code: 'seats',
  valueType: PrivilegeValueTypeEnum.Boolean,
  ...overrides,
})

describe('featureValidationSchema', () => {
  describe('GIVEN a feature without privileges', () => {
    describe('WHEN the code is empty', () => {
      it('THEN should report an error on the code', () => {
        expect(errorPaths({ ...emptyFeatureDefaultValues, name: 'Seats' })).toEqual(['code'])
      })
    })

    describe('WHEN only the code is filled', () => {
      it('THEN should be valid, as name and description are optional', () => {
        expect(errorPaths({ ...emptyFeatureDefaultValues, code: 'seats' })).toEqual([])
      })
    })
  })

  describe('GIVEN a feature with privileges', () => {
    describe('WHEN a privilege has no code', () => {
      it('THEN should report an error on that privilege code', () => {
        expect(
          errorPaths({
            ...emptyFeatureDefaultValues,
            code: 'seats',
            privileges: [aPrivilege(), aPrivilege({ code: '' })],
          }),
        ).toEqual(['privileges.1.code'])
      })
    })

    describe('WHEN a privilege has an unknown value type', () => {
      it('THEN should report an error on that privilege value type', () => {
        expect(
          errorPaths({
            ...emptyFeatureDefaultValues,
            code: 'seats',
            privileges: [aPrivilege({ valueType: '' })],
          }),
        ).toEqual(['privileges.0.valueType'])
      })
    })
  })

  describe('GIVEN a privilege typed as select', () => {
    describe.each([
      ['no config at all', undefined],
      ['an empty config', {}],
    ])('WHEN it has %s', (_, config) => {
      it('THEN should report a missing select options error', () => {
        expect(
          errorPaths({
            ...emptyFeatureDefaultValues,
            code: 'seats',
            privileges: [aPrivilege({ valueType: PrivilegeValueTypeEnum.Select, config })],
          }),
        ).toEqual(['privileges.0.config.selectOptions'])
      })
    })

    // Yup's `array().required('')` accepted `[]`, so an emptied option list must
    // stay valid: the migration must not tighten the rule into "at least one".
    describe('WHEN its select options are an empty array', () => {
      it('THEN should be valid', () => {
        expect(
          errorPaths({
            ...emptyFeatureDefaultValues,
            code: 'seats',
            privileges: [
              aPrivilege({
                valueType: PrivilegeValueTypeEnum.Select,
                config: { selectOptions: [] },
              }),
            ],
          }),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN a privilege not typed as select', () => {
    describe('WHEN it has no config', () => {
      it('THEN should be valid', () => {
        expect(
          errorPaths({
            ...emptyFeatureDefaultValues,
            code: 'seats',
            privileges: [aPrivilege({ valueType: PrivilegeValueTypeEnum.Integer })],
          }),
        ).toEqual([])
      })
    })
  })
})
