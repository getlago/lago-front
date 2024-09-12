import {
  serializeEmails,
  validateEmails,
} from '~/pages/CustomerRequestOverduePayment/validateEmails'

describe('validateEmails', () => {
  it('should return true for valid emails', () => {
    const validEmails = 'test@example.com, another@example.com,again@example.com'

    expect(validateEmails(validEmails)).toBe(true)
  })

  it('should return true for empty input', () => {
    const emptyEmails = ''

    expect(validateEmails(emptyEmails)).toBe(true)
  })

  it('should return true for whitespace input', () => {
    const whitespaceEmails = '   '

    expect(validateEmails(whitespaceEmails)).toBe(true)
  })

  it('should return false for invalid emails', () => {
    const invalidEmails = 'test@example.com, invalidemail , another@example.com ,again@example.com'

    expect(validateEmails(invalidEmails)).toBe(false)
  })
})

describe('serializeEmails', () => {
  it('should remove whitespace from emails', () => {
    const emails =
      'test@example.com, another@example.com ,  example@example.com,   other@example.com  '

    expect(serializeEmails(emails)).toBe(
      'test@example.com,another@example.com,example@example.com,other@example.com',
    )
  })
})
