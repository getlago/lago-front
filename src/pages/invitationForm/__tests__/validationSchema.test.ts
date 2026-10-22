import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

import { invitationLogInValidationSchema, invitationValidationSchema } from '../validationSchema'

describe('invitationValidationSchema', () => {
  it('rejects a password that does not follow the creation rules', () => {
    expect(invitationValidationSchema.safeParse({ password: 'weak' }).success).toBe(false)
  })

  it('accepts a password that follows the creation rules', () => {
    expect(invitationValidationSchema.safeParse({ password: 'ILoveLago1!' }).success).toBe(true)
  })
})

describe('invitationLogInValidationSchema', () => {
  // The password of an existing account can be older than the creation rules.
  it('accepts a password that does not follow the creation rules', () => {
    expect(invitationLogInValidationSchema.safeParse({ password: 'weak' }).success).toBe(true)
  })

  it('rejects an empty password', () => {
    const result = invitationLogInValidationSchema.safeParse({ password: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(PASSWORD_VALIDATION_ERRORS.REQUIRED)
  })
})
