import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionFeeSection } from '../SubscriptionFeeSection'
import { PlanFormInput } from '../types'

// --- Mocks ---

jest.mock('~/contexts/PlanFormContext', () => ({
  usePlanFormContext: () => ({
    currency: 'USD',
    interval: 'monthly',
  }),
}))

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (currency: string) => currency,
  intlFormatNumber: (value: number, opts?: { style?: string; currency?: string }) => {
    if (opts?.style === 'currency') return `$${value}`
    if (opts?.style === 'percent') return `${value}%`
    return String(value)
  },
}))

jest.mock('~/core/constants/form', () => ({
  FORM_TYPE_ENUM: { creation: 'creation', edition: 'edition' },
  getIntervalTranslationKey: { monthly: 'monthly_key', yearly: 'yearly_key' },
}))

// Mock the SubscriptionFeeDrawer
const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/SubscriptionFeeDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'subscription-fee-drawer-mock' })
  })

  MockedDrawer.displayName = 'SubscriptionFeeDrawer'

  return { SubscriptionFeeDrawer: MockedDrawer }
})

// --- Helpers ---

const createFormikProps = (overrides: Partial<PlanFormInput> = {}): FormikProps<PlanFormInput> => {
  const defaultValues: PlanFormInput = {
    name: 'Test Plan',
    code: 'test-plan',
    description: '',
    interval: PlanInterval.Monthly,
    payInAdvance: false,
    amountCents: '100',
    amountCurrency: CurrencyEnum.Usd,
    trialPeriod: 0,
    taxes: [],
    billChargesMonthly: false,
    billFixedChargesMonthly: false,
    charges: [],
    fixedCharges: [],
    minimumCommitment: {},
    invoiceDisplayName: '',
    entitlements: [],
    ...overrides,
  }

  return {
    values: defaultValues,
    initialValues: defaultValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false,
    submitCount: 0,
    dirty: false,
    isValid: true,
    status: undefined,
    handleBlur: jest.fn(),
    handleChange: jest.fn(),
    handleReset: jest.fn(),
    handleSubmit: jest.fn(),
    resetForm: jest.fn(),
    setErrors: jest.fn(),
    setFieldError: jest.fn(),
    setFieldTouched: jest.fn(),
    setFieldValue: jest.fn(),
    setFormikState: jest.fn(),
    setStatus: jest.fn(),
    setSubmitting: jest.fn(),
    setTouched: jest.fn(),
    setValues: jest.fn(),
    submitForm: jest.fn(),
    validateForm: jest.fn(),
    validateField: jest.fn(),
    getFieldHelpers: jest.fn(),
    getFieldMeta: jest.fn(),
    getFieldProps: jest.fn(),
    registerField: jest.fn(),
    unregisterField: jest.fn(),
  } as unknown as FormikProps<PlanFormInput>
}

const defaultProps = {
  formikProps: createFormikProps(),
  onDrawerSave: jest.fn(),
}

const getSelector = () => screen.getByRole('button', { name: /\$100/i })

describe('SubscriptionFeeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN default props are provided', () => {
      it('THEN should render the selector with formatted amount', () => {
        render(<SubscriptionFeeSection {...defaultProps} />)

        expect(getSelector()).toBeInTheDocument()
      })

      it('THEN should render the SubscriptionFeeDrawer', () => {
        render(<SubscriptionFeeSection {...defaultProps} />)

        expect(screen.getByTestId('subscription-fee-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN the selector is clicked', () => {
      it('THEN should open the drawer with current formik values', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({
          amountCents: '250',
          payInAdvance: true,
          trialPeriod: 14,
          invoiceDisplayName: 'Custom Fee',
        })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        await user.click(screen.getByRole('button', { name: /\$250/i }))

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          amountCents: '250',
          payInAdvance: true,
          trialPeriod: '14',
          invoiceDisplayName: 'Custom Fee',
        })
      })
    })

    describe('WHEN formik values have no trialPeriod', () => {
      it('THEN should pass empty string for trialPeriod when drawer is opened', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({
          trialPeriod: undefined as unknown as number,
        })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        await user.click(getSelector())

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            trialPeriod: '',
          }),
        )
      })
    })

    describe('WHEN formik trialPeriod is 0', () => {
      it('THEN should preserve 0 as "0" instead of converting to empty string', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({ trialPeriod: 0 })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        await user.click(getSelector())

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            trialPeriod: '0',
          }),
        )
      })
    })
  })

  describe('GIVEN the section has validation errors', () => {
    describe('WHEN amountCents has an error', () => {
      it('THEN should still render the section', () => {
        const formikProps = createFormikProps()

        ;(formikProps as unknown as { errors: Record<string, string> }).errors = {
          amountCents: 'required',
        }

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        expect(getSelector()).toBeInTheDocument()
      })
    })
  })
})
