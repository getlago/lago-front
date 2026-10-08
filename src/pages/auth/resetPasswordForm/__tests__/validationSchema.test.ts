import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

import { resetPasswordDefaultValues, resetPasswordValidationSchema } from '../validationSchema'

const messagesFor = (password: string): string[] => {
  const result = resetPasswordValidationSchema.safeParse({ password })

  if (result.success) return []

  return result.error.issues.map((issue) => issue.message)
}

describe('resetPasswordValidationSchema', () => {
  describe('GIVEN the form is untouched', () => {
    describe('WHEN parsing the default values', () => {
      it('THEN should report the password as required', () => {
        expect(messagesFor(resetPasswordDefaultValues.password)).toContain(
          PASSWORD_VALIDATION_ERRORS.REQUIRED,
        )
      })
    })
  })

  describe('GIVEN a password breaking a single rule', () => {
    describe('WHEN parsing it', () => {
      it.each([
        ['shorter than 8 characters', 'Ab1!', PASSWORD_VALIDATION_ERRORS.MIN],
        ['without a lowercase character', 'ABCDEFG1!', PASSWORD_VALIDATION_ERRORS.LOWERCASE],
        ['without an uppercase character', 'abcdefg1!', PASSWORD_VALIDATION_ERRORS.UPPERCASE],
        ['without a number', 'Abcdefgh!', PASSWORD_VALIDATION_ERRORS.NUMBER],
        ['without a special character', 'Abcdefg1', PASSWORD_VALIDATION_ERRORS.SPECIAL],
      ])('THEN should report the %s rule', (_, password, expectedMessage) => {
        expect(messagesFor(password)).toEqual([expectedMessage])
      })
    })
  })

  describe('GIVEN a password breaking every rule', () => {
    describe('WHEN parsing it', () => {
      it('THEN should report every rule at once', () => {
        expect(messagesFor('a')).toEqual(
          expect.arrayContaining([
            PASSWORD_VALIDATION_ERRORS.MIN,
            PASSWORD_VALIDATION_ERRORS.UPPERCASE,
            PASSWORD_VALIDATION_ERRORS.NUMBER,
            PASSWORD_VALIDATION_ERRORS.SPECIAL,
          ]),
        )
      })
    })
  })

  describe('GIVEN a valid password', () => {
    describe('WHEN parsing it', () => {
      // The legacy Yup schema accepted `/`, `_` and `-` as special characters, so a
      // password relying on them must stay valid after the Zod port.
      it.each([['MyPassw0rd!'], ['Abcdefg1/'], ['Abcdefg1_'], ['my-super-Passw0rD']])(
        'THEN should accept %p',
        (password) => {
          expect(messagesFor(password)).toEqual([])
        },
      )
    })
  })
})
