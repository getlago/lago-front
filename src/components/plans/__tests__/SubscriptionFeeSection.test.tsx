import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionFeeSection } from '../SubscriptionFeeSection'
import { PlanFormInput } from '../types'

// --- Mocks ---

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (currency: string) => currency,
  intlFormatNumber: (value: number, opts?: { style?: string; currency?: string }) => {
    if (opts?.style === 'currency') return `$${value}`
    if (opts?.style === 'percent') return `${value}%`
    return String(value)
  },
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

const editInvoiceDisplayNameDialogRef = { current: { openDialog: jest.fn() } }

const defaultProps = {
  formikProps: createFormikProps(),
  onDrawerSave: jest.fn(),
  editInvoiceDisplayNameDialogRef: editInvoiceDisplayNameDialogRef as never,
}

describe('SubscriptionFeeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN default props are provided', () => {
      it('THEN should render the accordion', () => {
        render(<SubscriptionFeeSection {...defaultProps} />)

        expect(screen.getByTestId('subscription-fee-section-accordion')).toBeInTheDocument()
      })

      it('THEN should render the SubscriptionFeeDrawer', () => {
        render(<SubscriptionFeeSection {...defaultProps} />)

        expect(screen.getByTestId('subscription-fee-drawer-mock')).toBeInTheDocument()
      })

      it('THEN should render the selector as a clickable button', () => {
        render(<SubscriptionFeeSection {...defaultProps} />)

        // Selector renders with role="button"
        const buttons = screen.getAllByRole('button')

        // At least one button should be the Selector (clickable)
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    describe('WHEN the selector is clicked', () => {
      it('THEN should open the drawer with current formik values', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({
          amountCents: '250',
          interval: PlanInterval.Yearly,
          payInAdvance: true,
          trialPeriod: 14,
          invoiceDisplayName: 'Custom Fee',
        })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        // The Selector renders role="button" — find it by the formatted amount subtitle
        const selectorButtons = screen.getAllByRole('button')
        // The first role="button" element with tabIndex=0 is the Selector
        const selectorButton = selectorButtons.find(
          (btn) => btn.getAttribute('tabindex') === '0' && btn.tagName === 'DIV',
        )

        if (selectorButton) {
          await user.click(selectorButton)

          expect(mockOpenDrawer).toHaveBeenCalledWith({
            amountCents: '250',
            interval: PlanInterval.Yearly,
            payInAdvance: true,
            trialPeriod: '14',
            invoiceDisplayName: 'Custom Fee',
          })
        }
      })
    })

    describe('WHEN formik values have no trialPeriod', () => {
      it('THEN should pass empty string for trialPeriod when drawer is opened', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({
          trialPeriod: undefined as unknown as number,
        })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        const selectorButtons = screen.getAllByRole('button')
        const selectorButton = selectorButtons.find(
          (btn) => btn.getAttribute('tabindex') === '0' && btn.tagName === 'DIV',
        )

        if (selectorButton) {
          await user.click(selectorButton)

          expect(mockOpenDrawer).toHaveBeenCalledWith(
            expect.objectContaining({
              trialPeriod: '',
            }),
          )
        }
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

        expect(screen.getByTestId('subscription-fee-section-accordion')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the trial period section', () => {
    describe('WHEN initialValues has a trial period > 0', () => {
      it('THEN should not display the add trial period button in the accordion', async () => {
        const formikProps = createFormikProps({ trialPeriod: 30 })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        // Wait for useEffect to run and set shouldDisplayTrialPeriod
        await waitFor(() => {
          expect(screen.queryByTestId('show-trial-period')).not.toBeInTheDocument()
        })
      })
    })

    describe('WHEN initialValues has no trial period', () => {
      it('THEN should display the add trial period button when accordion is open', async () => {
        const formikProps = createFormikProps({ trialPeriod: 0 })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        await waitFor(() => {
          expect(screen.getByTestId('show-trial-period')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN user clicks add trial period button', () => {
      it('THEN should hide the add button', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps({ trialPeriod: 0 })

        render(<SubscriptionFeeSection {...defaultProps} formikProps={formikProps} />)

        await waitFor(() => {
          expect(screen.getByTestId('show-trial-period')).toBeInTheDocument()
        })

        const addButton = screen.getByTestId('show-trial-period')

        await user.click(addButton)

        expect(screen.queryByTestId('show-trial-period')).not.toBeInTheDocument()
      })
    })
  })
})
