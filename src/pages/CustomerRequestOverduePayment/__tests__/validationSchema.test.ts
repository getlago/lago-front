import {
  CustomerRequestOverduePaymentForm,
  requestOverduePaymentValidationSchema,
} from '../validationSchema'

const buildValues = (
  overrides: Partial<CustomerRequestOverduePaymentForm> = {},
): CustomerRequestOverduePaymentForm => ({
  emails: 'billing@acme.com',
  paymentMethod: { paymentMethodId: undefined, paymentMethodType: undefined },
  ...overrides,
})

describe('requestOverduePaymentValidationSchema', () => {
  describe.each([
    ['a single email', 'billing@acme.com'],
    ['several emails separated by commas', 'billing@acme.com,accounting@acme.com'],
    ['several emails separated by commas and spaces', 'billing@acme.com, accounting@acme.com'],
  ])('GIVEN emails is %s', (_, emails) => {
    describe('WHEN it is parsed', () => {
      it('THEN should report no issue', () => {
        expect(
          requestOverduePaymentValidationSchema.safeParse(buildValues({ emails })).success,
        ).toBe(true)
      })
    })
  })

  describe('GIVEN emails is empty', () => {
    describe('WHEN it is parsed', () => {
      // The empty value must surface the required message only: chaining the
      // multi-email rule on top would stack a second message on the field.
      it('THEN should report the required issue alone', () => {
        const result = requestOverduePaymentValidationSchema.safeParse(buildValues({ emails: '' }))

        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toEqual([
            expect.objectContaining({
              path: ['emails'],
              message: 'text_620bc4d4269a55014d493f3d',
            }),
          ])
        }
      })
    })
  })

  describe.each([
    ['a single invalid email', 'not-an-email'],
    ['one invalid email among valid ones', 'billing@acme.com, not-an-email'],
    ['a trailing separator', 'billing@acme.com,'],
  ])('GIVEN emails is %s', (_, emails) => {
    describe('WHEN it is parsed', () => {
      it('THEN should report the invalid-emails issue on emails', () => {
        const result = requestOverduePaymentValidationSchema.safeParse(buildValues({ emails }))

        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toEqual([
            expect.objectContaining({
              path: ['emails'],
              message: 'text_66b258f62100490d0eb5ca8b',
            }),
          ])
        }
      })
    })
  })

  describe('GIVEN no payment method is selected', () => {
    describe('WHEN it is parsed', () => {
      it('THEN should report no issue', () => {
        expect(requestOverduePaymentValidationSchema.safeParse(buildValues()).success).toBe(true)
      })
    })
  })
})
