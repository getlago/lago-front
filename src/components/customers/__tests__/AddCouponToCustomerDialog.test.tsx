import { act, renderHook } from '@testing-library/react'

import { CouponFrequency, CouponTypeEnum, CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { useAddCouponToCustomerDialog } from '../AddCouponToCustomerDialog'

const mockFormDialogOpen = jest.fn()
const mockAddCoupon = jest.fn()

jest.mock('~/components/dialogs/FormDialog', () => ({
  ...jest.requireActual('~/components/dialogs/FormDialog'),
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useAddCouponMutation: (options?: { onCompleted?: (data: unknown) => void }) => [
      async (variables: unknown) => {
        const result = await mockAddCoupon(variables)

        if (result?.data) {
          options?.onCompleted?.(result.data)
        }

        return result
      },
    ],
  }
})

const mockCustomer = { id: 'customer-1', displayName: 'Acme' }

type DialogForm = {
  setFieldValue: (name: string, value: unknown) => void
}

type FormValues = {
  couponType?: CouponTypeEnum
  amountCents?: string | number
  amountCurrency?: CurrencyEnum
  percentageRate?: string | number
  frequency?: CouponFrequency
  frequencyDuration?: string | number
}

const customWrapper = ({ children }: { children: React.ReactNode }) => AllTheProviders({ children })

/**
 * Opens the dialog, applies `values` to the real form instance (as the text
 * inputs would), then runs the dialog's submit handler. Returns the submit
 * error, if any, so invalid cases can be asserted without failing the test.
 *
 * `mockFormDialogOpen` returns a never-resolving promise on purpose: the real
 * `open()` promise resolving would run the hook's `.then()` cleanup, which
 * clears the customer ref and would short-circuit the submit.
 */
const submitWithValues = async (values: FormValues): Promise<{ submitError: unknown }> => {
  mockFormDialogOpen.mockReturnValue(new Promise<never>(() => {}))

  const { result } = renderHook(() => useAddCouponToCustomerDialog(), { wrapper: customWrapper })

  await act(async () => {
    result.current.openAddCouponToCustomerDialog({ customer: mockCustomer })
  })

  const config = mockFormDialogOpen.mock.calls[0][0]
  const form = config.children.props.form as DialogForm

  await act(async () => {
    form.setFieldValue('couponId', 'coupon-1')

    Object.entries(values).forEach(([name, value]) => {
      form.setFieldValue(name, value)
    })
  })

  let submitError: unknown = null

  await act(async () => {
    try {
      await config.form.submit()
    } catch (err) {
      submitError = err
    }
  })

  return { submitError }
}

describe('useAddCouponToCustomerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddCoupon.mockResolvedValue({
      data: { createAppliedCoupon: { id: 'applied-coupon-1' } },
      errors: undefined,
    })
  })

  describe('GIVEN a fixed amount coupon', () => {
    describe('WHEN the amount was edited in the input, so it is a string', () => {
      it('THEN should submit it serialized as a number', async () => {
        await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents: '20',
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).toHaveBeenCalledWith({
          variables: {
            input: {
              customerId: 'customer-1',
              couponId: 'coupon-1',
              frequency: CouponFrequency.Once,
              amountCents: 2000,
              amountCurrency: CurrencyEnum.Usd,
              percentageRate: undefined,
              frequencyDuration: undefined,
            },
          },
        })
      })

      it('THEN should keep decimals of a string amount', async () => {
        await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents: '12.34',
          amountCurrency: CurrencyEnum.Eur,
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({ amountCents: 1234 }),
            }),
          }),
        )
      })
    })

    describe('WHEN the amount is still the number seeded from the coupon', () => {
      it('THEN should submit it serialized as a number', async () => {
        await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents: 20,
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({ amountCents: 2000 }),
            }),
          }),
        )
      })
    })

    describe.each([
      ['empty', ''],
      ['not a number', 'abc'],
      ['below the minimum', '0.0001'],
    ])('WHEN the amount is %s', (_label, amountCents) => {
      it('THEN should not call the mutation', async () => {
        const { submitError } = await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents,
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).not.toHaveBeenCalled()
        expect(submitError).toBeInstanceOf(Error)
      })
    })
  })

  describe('GIVEN a percentage coupon', () => {
    describe('WHEN the rate was edited in the input, so it is a string', () => {
      it('THEN should submit it as a number and omit the amount', async () => {
        await submitWithValues({
          couponType: CouponTypeEnum.Percentage,
          percentageRate: '25.5',
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({
                percentageRate: 25.5,
                amountCents: undefined,
                amountCurrency: undefined,
              }),
            }),
          }),
        )
      })
    })

    describe('WHEN the rate is not a number', () => {
      it('THEN should not call the mutation', async () => {
        const { submitError } = await submitWithValues({
          couponType: CouponTypeEnum.Percentage,
          percentageRate: 'abc',
          frequency: CouponFrequency.Once,
        })

        expect(mockAddCoupon).not.toHaveBeenCalled()
        expect(submitError).toBeInstanceOf(Error)
      })
    })
  })

  describe('GIVEN a recurring frequency', () => {
    describe('WHEN the duration was edited in the input, so it is a string', () => {
      it('THEN should submit it as a number, since the API expects an Int', async () => {
        await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents: '20',
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Recurring,
          frequencyDuration: '12',
        })

        expect(mockAddCoupon).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({
              input: expect.objectContaining({ frequencyDuration: 12 }),
            }),
          }),
        )
      })
    })

    describe('WHEN the duration is below the minimum', () => {
      it('THEN should not call the mutation', async () => {
        const { submitError } = await submitWithValues({
          couponType: CouponTypeEnum.FixedAmount,
          amountCents: '20',
          amountCurrency: CurrencyEnum.Usd,
          frequency: CouponFrequency.Recurring,
          frequencyDuration: '0',
        })

        expect(mockAddCoupon).not.toHaveBeenCalled()
        expect(submitError).toBeInstanceOf(Error)
      })
    })
  })
})
