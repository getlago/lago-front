import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { render } from '~/test-utils'

import {
  ADD_MINIMUM_COMMITMENT_TEST_ID,
  CommitmentsSection,
  OPEN_MINIMUM_COMMITMENT_DRAWER_TEST_ID,
} from '../CommitmentsSection'
import { PlanFormInput } from '../types'

// --- Mocks ---

jest.mock('~/hooks/useCurrentUser')

const mockedUseCurrentUser = jest.mocked(useCurrentUser)

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
  SEARCH_TAX_INPUT_FOR_MIN_COMMITMENT_CLASSNAME: 'search-tax-min-commitment',
}))

// Mock the MinimumCommitmentDrawer
const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/MinimumCommitmentDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'minimum-commitment-drawer-mock' })
  })

  MockedDrawer.displayName = 'MinimumCommitmentDrawer'

  return { MinimumCommitmentDrawer: MockedDrawer }
})

jest.mock('~/components/premium/PremiumFeature', () => {
  const MockPremiumFeature = (props: { title: string }) => (
    <div data-test="premium-feature">{props.title}</div>
  )

  return { __esModule: true, default: MockPremiumFeature }
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

describe('CommitmentsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseCurrentUser.mockReturnValue({ isPremium: true } as ReturnType<typeof useCurrentUser>)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the user is premium and no commitment exists', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should render the add button', () => {
        render(<CommitmentsSection {...defaultProps} />)

        expect(screen.getByTestId(ADD_MINIMUM_COMMITMENT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the MinimumCommitmentDrawer', () => {
        render(<CommitmentsSection {...defaultProps} />)

        expect(screen.getByTestId('minimum-commitment-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN the add button is clicked', () => {
      it('THEN should open the drawer with empty values', async () => {
        const user = userEvent.setup()

        render(<CommitmentsSection {...defaultProps} />)

        await user.click(screen.getByTestId(ADD_MINIMUM_COMMITMENT_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          amountCents: '',
          invoiceDisplayName: undefined,
          taxes: [],
        })
      })
    })
  })

  describe('GIVEN a commitment exists', () => {
    const formikWithCommitment = createFormikProps({
      minimumCommitment: {
        amountCents: '1000',
        invoiceDisplayName: 'Custom Commitment',
        taxes: [{ id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 }],
      },
    })

    describe('WHEN the component is rendered', () => {
      it('THEN should render the Selector card with commitment info', () => {
        render(<CommitmentsSection formikProps={formikWithCommitment} onDrawerSave={jest.fn()} />)

        expect(screen.getByTestId(OPEN_MINIMUM_COMMITMENT_DRAWER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not render the add button', () => {
        render(<CommitmentsSection formikProps={formikWithCommitment} onDrawerSave={jest.fn()} />)

        expect(screen.queryByTestId(ADD_MINIMUM_COMMITMENT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the selector is clicked', () => {
      it('THEN should open the drawer with current values', async () => {
        const user = userEvent.setup()

        render(<CommitmentsSection formikProps={formikWithCommitment} onDrawerSave={jest.fn()} />)

        await user.click(screen.getByTestId(OPEN_MINIMUM_COMMITMENT_DRAWER_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          amountCents: '1000',
          invoiceDisplayName: 'Custom Commitment',
          taxes: [{ id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 }],
        })
      })
    })
  })

  describe('GIVEN the user is not premium', () => {
    beforeEach(() => {
      mockedUseCurrentUser.mockReturnValue({
        isPremium: false,
      } as ReturnType<typeof useCurrentUser>)
    })

    describe('WHEN no commitment exists', () => {
      it('THEN should render the premium feature gate', () => {
        render(<CommitmentsSection {...defaultProps} />)

        expect(screen.getByTestId('premium-feature')).toBeInTheDocument()
      })

      it('THEN should not render the add button', () => {
        render(<CommitmentsSection {...defaultProps} />)

        expect(screen.queryByTestId(ADD_MINIMUM_COMMITMENT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
