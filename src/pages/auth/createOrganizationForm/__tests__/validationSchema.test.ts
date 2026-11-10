import { SignupRoleEnum, SignupSourceEnum } from '~/generated/graphql'

import {
  CREATE_ORGANIZATION_NAME_ERRORS,
  createOrganizationValidationSchema,
  getCreateOrganizationDefaultValues,
} from '../validationSchema'

type CreateOrganizationValues = ReturnType<typeof getCreateOrganizationDefaultValues>

const VALID_VALUES: CreateOrganizationValues = {
  name: 'Hooli',
  role: SignupRoleEnum.Engineering,
  source: undefined,
}

const getMessages = (values: Record<string, unknown>, field: string): string[] => {
  const result = createOrganizationValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message)
}

describe('getCreateOrganizationDefaultValues', () => {
  describe('GIVEN an email', () => {
    it.each([
      ['a company email', 'raffi@hooli.com', 'Hooli'],
      ['a hyphenated domain', 'a@acme-corp.io', 'Acme-corp'],
      ['a subdomain', 'jane@mail.hooli.com', 'Mail'],
      ['an already capitalised domain', 'jane@Hooli.com', 'Hooli'],
      ['a domain without a dot', 'jane@localhost', 'Localhost'],
      ['an address without a domain', 'jane', ''],
      ['an address with an empty domain', 'jane@', ''],
      ['an empty email', '', ''],
      ['no email', undefined, ''],
    ])('THEN should prefill the name from %s', (_, email, expectedName) => {
      expect(getCreateOrganizationDefaultValues(email).name).toBe(expectedName)
    })

    it('THEN should leave role and source empty', () => {
      const values = getCreateOrganizationDefaultValues('raffi@hooli.com')

      expect(values.role).toBeUndefined()
      expect(values.source).toBeUndefined()
    })
  })
})

describe('createOrganizationValidationSchema', () => {
  describe('GIVEN a name value', () => {
    it.each([
      ['an empty name', '', [CREATE_ORGANIZATION_NAME_ERRORS.REQUIRED]],
      ['a whitespace-only name', '   ', [CREATE_ORGANIZATION_NAME_ERRORS.REQUIRED]],
      ['a 100-character name', 'a'.repeat(100), []],
      ['a 101-character name', 'a'.repeat(101), [CREATE_ORGANIZATION_NAME_ERRORS.TOO_LONG]],
      ['100 characters padded with spaces', ` ${'a'.repeat(100)} `, []],
      ['100 emojis spanning 200 UTF-16 units', '😀'.repeat(100), []],
      ['101 emojis', '😀'.repeat(101), [CREATE_ORGANIZATION_NAME_ERRORS.TOO_LONG]],
      ['a regular name', 'Hooli', []],
    ])('THEN should return the expected errors for %s', (_, name, expectedErrors) => {
      expect(getMessages({ ...VALID_VALUES, name }, 'name')).toEqual(expectedErrors)
    })

    it('THEN should trim the parsed name', () => {
      const result = createOrganizationValidationSchema.parse({ ...VALID_VALUES, name: ' Hooli ' })

      expect(result.name).toBe('Hooli')
    })
  })

  describe('GIVEN a role value', () => {
    it.each(Object.values(SignupRoleEnum))('THEN should accept the %s role', (role) => {
      expect(getMessages({ ...VALID_VALUES, role }, 'role')).toEqual([])
    })

    it('THEN should accept a missing role', () => {
      expect(getMessages({ ...VALID_VALUES, role: undefined }, 'role')).toEqual([])
    })

    it('THEN should reject a value outside the enum', () => {
      expect(getMessages({ ...VALID_VALUES, role: 'ceo' }, 'role')).toHaveLength(1)
    })
  })

  describe('GIVEN a source value', () => {
    it.each(Object.values(SignupSourceEnum))('THEN should accept the %s source', (source) => {
      expect(getMessages({ ...VALID_VALUES, source }, 'source')).toEqual([])
    })

    it('THEN should accept a missing source', () => {
      expect(getMessages({ ...VALID_VALUES, source: undefined }, 'source')).toEqual([])
    })

    it('THEN should reject a value outside the enum', () => {
      expect(getMessages({ ...VALID_VALUES, source: 'tv' }, 'source')).toHaveLength(1)
    })
  })
})
