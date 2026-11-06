import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

import { verifyEmailPasswordSchema, verifyEmailSecretSchema } from '../validationSchema'

describe('verifyEmail validation schemas', () => {
  describe('GIVEN the link needs the password', () => {
    describe('WHEN the password is empty', () => {
      it('THEN should require it', () => {
        const result = verifyEmailPasswordSchema.safeParse({ password: '' })

        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe(PASSWORD_VALIDATION_ERRORS.REQUIRED)
      })
    })

    describe('WHEN a password is typed', () => {
      it('THEN should accept it without checking its rules', () => {
        expect(verifyEmailPasswordSchema.safeParse({ password: 'a' }).success).toBe(true)
      })
    })
  })

  describe('GIVEN the browser holds the signup secret', () => {
    describe('WHEN the password is empty', () => {
      it('THEN should accept it', () => {
        expect(verifyEmailSecretSchema.safeParse({ password: '' }).success).toBe(true)
      })
    })
  })
})
