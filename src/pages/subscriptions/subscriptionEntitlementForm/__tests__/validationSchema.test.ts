import { PrivilegeValueTypeEnum } from '~/generated/graphql'

import { REQUIRED_FIELD_ERROR, subscriptionEntitlementValidationSchema } from '../validationSchema'

const validPrivilege = {
  code: 'seats',
  name: 'Seats',
  value: '10',
  valueType: PrivilegeValueTypeEnum.Integer,
  config: undefined,
}

const erroredPaths = (values: unknown): string[] => {
  const result = subscriptionEntitlementValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => issue.path.join('.'))
}

describe('subscriptionEntitlementValidationSchema', () => {
  describe('GIVEN a feature code', () => {
    describe('WHEN it is filled and there is no privilege', () => {
      it('THEN should accept the values', () => {
        expect(erroredPaths({ code: 'feat_a', privileges: [] })).toEqual([])
      })
    })

    describe.each([
      ['empty', ''],
      ['undefined', undefined],
    ])('WHEN it is %s', (_, code) => {
      it('THEN should report the code as required', () => {
        expect(erroredPaths({ code, privileges: [] })).toEqual(['code'])
      })

      it('THEN should use the translatable required message', () => {
        const result = subscriptionEntitlementValidationSchema.safeParse({ code, privileges: [] })

        expect(result.success).toBe(false)
        expect(result.error?.issues[0].message).toBe(REQUIRED_FIELD_ERROR)
      })
    })
  })

  describe('GIVEN a privilege', () => {
    describe('WHEN every field is filled', () => {
      it('THEN should accept the values', () => {
        expect(erroredPaths({ code: 'feat_a', privileges: [validPrivilege] })).toEqual([])
      })
    })

    describe.each([
      ['value', 'value'],
      ['code', 'code'],
    ])('WHEN its %s is empty', (_, field) => {
      it('THEN should report that privilege field', () => {
        expect(
          erroredPaths({
            code: 'feat_a',
            privileges: [{ ...validPrivilege, [field]: '' }],
          }),
        ).toEqual([`privileges.0.${field}`])
      })
    })

    describe('WHEN its name is empty', () => {
      it('THEN should accept the values', () => {
        expect(
          erroredPaths({ code: 'feat_a', privileges: [{ ...validPrivilege, name: '' }] }),
        ).toEqual([])
      })
    })

    describe('WHEN a select privilege carries null options', () => {
      it('THEN should accept the values', () => {
        expect(
          erroredPaths({
            code: 'feat_a',
            privileges: [
              {
                ...validPrivilege,
                valueType: PrivilegeValueTypeEnum.Select,
                config: { selectOptions: null },
              },
            ],
          }),
        ).toEqual([])
      })
    })

    describe('WHEN only the second one is invalid', () => {
      it('THEN should report that row only', () => {
        expect(
          erroredPaths({
            code: 'feat_a',
            privileges: [validPrivilege, { ...validPrivilege, code: 'other', value: '' }],
          }),
        ).toEqual(['privileges.1.value'])
      })
    })
  })
})
