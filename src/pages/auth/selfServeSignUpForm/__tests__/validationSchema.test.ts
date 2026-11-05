import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

import {
  getSelfServePasswordErrors,
  isSelfServePasswordTooLong,
  SELF_SERVE_EMAIL_INVALID_ERROR,
  SELF_SERVE_EMAIL_REQUIRED_ERROR,
  SELF_SERVE_PASSWORD_TOO_LONG_ERROR,
  selfServeSignUpEmailSchema,
  selfServeSignUpValidationSchema,
} from '../validationSchema'

const { MIN, LOWERCASE, UPPERCASE, NUMBER, SPECIAL, REQUIRED } = PASSWORD_VALIDATION_ERRORS

const VALID_EMAIL = 'jane@hooli.com'
const VALID_PASSWORD = 'Abcdefg1!'

const getMessages = (values: { email: string; password: string }, field: string): string[] => {
  const result = selfServeSignUpValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message)
}

describe('getSelfServePasswordErrors', () => {
  describe('GIVEN a password', () => {
    it.each([
      ['an empty password', '', [MIN, LOWERCASE, UPPERCASE, NUMBER, SPECIAL]],
      ['only lowercase letters', 'abcdefgh', [UPPERCASE, NUMBER, SPECIAL]],
      ['every rule met', VALID_PASSWORD, []],
      ['accented letters in both cases', 'Éé1!aaaa', []],
      ['accented uppercase letters only', 'ÉÉ1!AAAA', [LOWERCASE]],
      ['a non-ASCII decimal digit', 'Abcdefg٣!', []],
      ['a whitespace as the only non-alphanumeric character', 'Abcdefg1 ', [SPECIAL]],
      ['a currency symbol as the special character', 'Abcdefg1€', []],
      ['7 code points spanning 8 UTF-16 units', 'Ab1!xy😀', [MIN]],
      ['8 code points including an emoji', 'Ab1!xyz😀', []],
    ])('THEN should return the unmet rules for %s', (_, password, expectedErrors) => {
      expect(getSelfServePasswordErrors(password)).toEqual(expectedErrors)
    })
  })
})

describe('isSelfServePasswordTooLong', () => {
  describe('GIVEN a password', () => {
    it.each([
      ['72 ASCII bytes', 'a'.repeat(72), false],
      ['73 ASCII bytes', 'a'.repeat(73), true],
      ['74 characters weighing 144 bytes', `aB1!${'é'.repeat(70)}`, true],
    ])('THEN should tell whether %s is too long', (_, password, expected) => {
      expect(isSelfServePasswordTooLong(password)).toBe(expected)
    })
  })
})

describe('selfServeSignUpEmailSchema', () => {
  describe('GIVEN an email value', () => {
    it.each([
      ['an empty value', '', SELF_SERVE_EMAIL_REQUIRED_ERROR],
      ['only spaces', '   ', SELF_SERVE_EMAIL_REQUIRED_ERROR],
      ['a value without domain', 'raffi@', SELF_SERVE_EMAIL_INVALID_ERROR],
      ['a value without at sign', 'raffi', SELF_SERVE_EMAIL_INVALID_ERROR],
    ])('THEN should reject %s with its message first', (_, email, expectedMessage) => {
      const result = selfServeSignUpEmailSchema.safeParse(email)

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe(expectedMessage)
    })

    it('THEN should accept a valid address and trim it', () => {
      const result = selfServeSignUpEmailSchema.safeParse(`  ${VALID_EMAIL} `)

      expect(result.success).toBe(true)
      expect(result.data).toBe(VALID_EMAIL)
    })
  })
})

describe('selfServeSignUpValidationSchema', () => {
  describe('GIVEN a valid email and a password meeting every rule', () => {
    it('THEN should pass', () => {
      expect(
        selfServeSignUpValidationSchema.safeParse({ email: VALID_EMAIL, password: VALID_PASSWORD })
          .success,
      ).toBe(true)
    })
  })

  describe('GIVEN an invalid email', () => {
    it('THEN should report the email format message on the email field', () => {
      expect(getMessages({ email: 'raffi@', password: VALID_PASSWORD }, 'email')).toEqual([
        SELF_SERVE_EMAIL_INVALID_ERROR,
      ])
    })
  })

  describe('GIVEN an empty password', () => {
    it('THEN should report only the required message on the password field', () => {
      const result = selfServeSignUpValidationSchema.safeParse({ email: VALID_EMAIL, password: '' })

      expect(result.error?.issues.map(({ path, message }) => ({ path, message }))).toEqual([
        { path: ['password'], message: REQUIRED },
      ])
    })
  })

  describe('GIVEN a password missing some rules', () => {
    it('THEN should report every unmet rule on the password field', () => {
      expect(getMessages({ email: VALID_EMAIL, password: 'abcdefgh' }, 'password')).toEqual([
        UPPERCASE,
        NUMBER,
        SPECIAL,
      ])
    })
  })

  describe('GIVEN the 72-byte cap on the password', () => {
    it.each([
      ['72 ASCII characters', `aB1!${'a'.repeat(68)}`],
      ['72 bytes of accented characters', `aB1!${'é'.repeat(34)}`],
    ])('THEN should accept %s', (_, password) => {
      expect(getMessages({ email: VALID_EMAIL, password }, 'password')).toEqual([])
    })

    it.each([
      ['73 bytes of mixed characters', `aB1!x${'é'.repeat(34)}`],
      ['74 characters weighing 144 bytes', `aB1!${'é'.repeat(70)}`],
    ])('THEN should report the too long message for %s', (_, password) => {
      expect(getMessages({ email: VALID_EMAIL, password }, 'password')).toEqual([
        SELF_SERVE_PASSWORD_TOO_LONG_ERROR,
      ])
    })
  })
})
