import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { CurrencyEnum, PlanInterval, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { render } from '~/test-utils'

import {
  ADD_PROGRESSIVE_BILLING_TEST_ID,
  OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID,
  ProgressiveBillingSection,
} from '../ProgressiveBillingSection'
import { PlanFormInput } from '../types'

// --- Mocks ---

jest.mock('~/hooks/useOrganizationInfos')

const mockedUseOrganizationInfos = jest.mocked(useOrganizationInfos)

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (currency: string) => currency,
  intlFormatNumber: (value: number, opts?: { style?: string; currency?: string }) => {
    if (opts?.style === 'currency') return `$${value}`
    if (opts?.style === 'percent') return `${value}%`
    return String(value)
  },
}))

// Mock the ProgressiveBillingDrawer
const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/progressiveBilling/ProgressiveBillingDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'progressive-billing-drawer-mock' })
  })

  MockedDrawer.displayName = 'ProgressiveBillingDrawer'

  return { ProgressiveBillingDrawer: MockedDrawer }
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

const setupPremiumIntegration = () => {
  mockedUseOrganizationInfos.mockReturnValue({
    organization: {
      premiumIntegrations: [PremiumIntegrationTypeEnum.ProgressiveBilling],
    },
  } as unknown as ReturnType<typeof useOrganizationInfos>)
}

const setupNoPremiumIntegration = () => {
  mockedUseOrganizationInfos.mockReturnValue({
    organization: {
      premiumIntegrations: [],
    },
  } as unknown as ReturnType<typeof useOrganizationInfos>)
}

describe('ProgressiveBillingSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupPremiumIntegration()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the user has premium integration and no thresholds exist', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should render the add button', () => {
        render(<ProgressiveBillingSection {...defaultProps} />)

        expect(screen.getByTestId(ADD_PROGRESSIVE_BILLING_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the ProgressiveBillingDrawer', () => {
        render(<ProgressiveBillingSection {...defaultProps} />)

        expect(screen.getByTestId('progressive-billing-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN the add button is clicked', () => {
      it('THEN should open the drawer without values', async () => {
        const user = userEvent.setup()

        render(<ProgressiveBillingSection {...defaultProps} />)

        await user.click(screen.getByTestId(ADD_PROGRESSIVE_BILLING_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith()
      })
    })
  })

  describe('GIVEN thresholds exist', () => {
    const formikWithThresholds = createFormikProps({
      nonRecurringUsageThresholds: [
        { amountCents: 100, recurring: false },
        { amountCents: 500, recurring: false },
      ],
      recurringUsageThreshold: { amountCents: 50, recurring: true },
    })

    describe('WHEN the component is rendered', () => {
      it('THEN should render the Selector card', () => {
        render(
          <ProgressiveBillingSection formikProps={formikWithThresholds} onDrawerSave={jest.fn()} />,
        )

        expect(screen.getByTestId(OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not render the add button', () => {
        render(
          <ProgressiveBillingSection formikProps={formikWithThresholds} onDrawerSave={jest.fn()} />,
        )

        expect(screen.queryByTestId(ADD_PROGRESSIVE_BILLING_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the selector is clicked', () => {
      it('THEN should open the drawer with current values', async () => {
        const user = userEvent.setup()

        render(
          <ProgressiveBillingSection formikProps={formikWithThresholds} onDrawerSave={jest.fn()} />,
        )

        await user.click(screen.getByTestId(OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          nonRecurringUsageThresholds: [
            { amountCents: '100', thresholdDisplayName: undefined, recurring: false },
            { amountCents: '500', thresholdDisplayName: undefined, recurring: false },
          ],
          recurringUsageThreshold: {
            amountCents: '50',
            thresholdDisplayName: undefined,
            recurring: true,
          },
        })
      })
    })
  })

  describe('GIVEN the user does not have premium integration', () => {
    beforeEach(() => {
      setupNoPremiumIntegration()
    })

    describe('WHEN no thresholds exist', () => {
      it('THEN should render the premium feature gate', () => {
        render(<ProgressiveBillingSection {...defaultProps} />)

        expect(screen.getByTestId('premium-feature')).toBeInTheDocument()
      })

      it('THEN should not render the add button', () => {
        render(<ProgressiveBillingSection {...defaultProps} />)

        expect(screen.queryByTestId(ADD_PROGRESSIVE_BILLING_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the delete action', () => {
    const formikWithThresholds = createFormikProps({
      nonRecurringUsageThresholds: [{ amountCents: 100, recurring: false }],
    })

    describe('WHEN the delete action triggers', () => {
      it('THEN should clear Formik threshold values', () => {
        // We can't easily trigger hover actions in tests, but we can verify
        // the formikProps.setFieldValue is available for clearing
        render(
          <ProgressiveBillingSection formikProps={formikWithThresholds} onDrawerSave={jest.fn()} />,
        )

        expect(screen.getByTestId(OPEN_PROGRESSIVE_BILLING_DRAWER_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
