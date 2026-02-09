import {
  resendEmailFormDefaultValues,
  resendEmailFormValidationSchema,
} from '~/components/emails/resendEmail/formInitialization'

describe('ResendEmailHeaderContent', () => {
  it('has form initialization configured', () => {
    // Test that the form configuration exists
    expect(resendEmailFormDefaultValues).toBeDefined()
    expect(resendEmailFormValidationSchema).toBeDefined()
  })

  it('default values match expected structure', () => {
    expect(resendEmailFormDefaultValues).toEqual({
      to: undefined,
      cc: undefined,
      bcc: undefined,
    })
  })
})
