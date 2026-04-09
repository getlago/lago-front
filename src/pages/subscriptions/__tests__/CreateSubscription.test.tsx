import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import CreateSubscription from '../CreateSubscription'

// --- Mock state ---

let mockPlanFormIsDirty = false
let mockPlanFormCanSubmit = true

const mockOnSave = jest.fn()

// --- Mocks ---

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    loading: false,
    organization: undefined,
    timezone: 'TZ_UTC',
    timezoneConfig: { name: 'UTC', offset: '+00:00' },
    hasFeatureFlag: () => false,
    hasOrganizationPremiumAddon: () => false,
    refetchOrganizationInfos: jest.fn(),
    intlFormatDateTimeOrgaTZ: (date: string) => ({ date, time: '', timezone: '' }),
  }),
}))

jest.mock('~/hooks/useIframeConfig', () => ({
  useIframeConfig: () => ({
    emitIframeMessage: jest.fn(),
    emitSalesForceEvent: jest.fn(),
    isRunningInIframeContext: false,
    isRunningInSalesForceIframe: false,
  }),
}))

jest.mock('~/hooks/customer/useAddSubscription', () => ({
  useAddSubscription: () => ({
    formType: 'creation',
    onSave: mockOnSave,
  }),
}))

const mockPlanFormStore = {
  subscribe: jest.fn((cb: () => void) => {
    cb()
    return () => {}
  }),
  listeners: new Set(),
  state: { values: {} },
}

const mockPlanForm = {
  store: mockPlanFormStore,
  state: { values: { amountCurrency: 'USD' } },
  setFieldValue: jest.fn(),
  getFieldValue: jest.fn(),
  reset: jest.fn(),
}

jest.mock('~/hooks/plans/usePlanForm', () => ({
  usePlanForm: () => ({
    form: mockPlanForm,
    plan: undefined,
    isEdition: false,
    loading: false,
    type: 'creation',
  }),
}))

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((_store: unknown, selector: (state: Record<string, unknown>) => unknown) => {
    const state = { isDirty: mockPlanFormIsDirty, canSubmit: mockPlanFormCanSubmit }
    return selector(state)
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  envGlobalVar: () => ({ sentryDsn: '', apiUrl: '', appVersion: '' }),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetPlansLazyQuery: jest.fn(() => [jest.fn(), { loading: false, data: null }]),
    useGetCustomerForCreateSubscriptionQuery: jest.fn(() => ({
      data: {
        customer: {
          id: 'customer-1',
          name: 'Test Customer',
          displayName: 'Test Customer',
          externalId: 'ext-1',
          applicableTimezone: 'TZ_UTC',
        },
      },
    })),
    useGetSubscriptionForCreateSubscriptionQuery: jest.fn(() => ({
      data: null,
      loading: false,
    })),
  }
})

jest.mock('~/components/designSystem/WarningDialog', () => ({
  WarningDialog: () => <div data-test="warning-dialog" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...((): any => {
    // Capture ref via mock
    const actual = jest.requireActual('react')
    const originalUseRef = actual.useRef

    jest.spyOn(actual, 'useRef').mockImplementation((initialValue: unknown) => {
      // Restore immediately to not break other useRef calls
      return originalUseRef(initialValue)
    })

    return {}
  })(),
}))

// Mock heavy child components to avoid deep rendering
jest.mock('~/components/plans/PlanSettingsSection', () => ({
  PlanSettingsSection: () => <div data-test="plan-settings-section" />,
}))

jest.mock('~/components/plans/SubscriptionFeeSection', () => ({
  SubscriptionFeeSection: () => <div data-test="subscription-fee-section" />,
}))

jest.mock('~/components/plans/form/FixedChargesSection', () => ({
  FixedChargesSection: () => <div data-test="fixed-charges-section" />,
}))

jest.mock('~/components/plans/UsageChargesSection', () => ({
  UsageChargesSection: () => <div data-test="usage-charges-section" />,
}))

jest.mock('~/components/plans/CommitmentsSection', () => ({
  CommitmentsSection: () => <div data-test="commitments-section" />,
}))

jest.mock('~/components/subscriptions/ProgressiveBillingSection', () => ({
  ProgressiveBillingSection: () => <div data-test="progressive-billing-section" />,
}))

jest.mock('~/components/subscriptions/FeatureEntitlementSection', () => ({
  FeatureEntitlementSection: () => <div data-test="feature-entitlement-section" />,
}))

jest.mock('~/components/PremiumWarningDialog', () => ({
  PremiumWarningDialog: () => <div data-test="premium-warning-dialog" />,
}))

jest.mock('~/components/invoices/EditInvoiceDisplayNameDialog', () => ({
  EditInvoiceDisplayNameDialog: () => <div data-test="edit-invoice-display-name-dialog" />,
}))

jest.mock('~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings', () => ({
  PaymentMethodsInvoiceSettings: () => <div data-test="payment-methods-settings" />,
}))

jest.mock('~/contexts/PlanFormContext', () => ({
  PlanFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('~/components/customers/subscriptions/SubscriptionDatesOffsetHelperComponent', () => ({
  SubscriptionDatesOffsetHelperComponent: () => null,
}))

// --- Helpers ---

const renderCreateSubscription = () =>
  render(<CreateSubscription />, {
    mocks: [],
  })

// --- Tests ---

describe('CreateSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPlanFormIsDirty = false
    mockPlanFormCanSubmit = true
    testMockNavigateFn.mockClear()

    // Mock useParams to provide customerId
    const Router = jest.requireMock('react-router-dom')

    Router.useParams.mockReturnValue({ customerId: 'customer-1' })
  })

  describe('GIVEN the submit button reactive state', () => {
    describe('WHEN planFormCanSubmit is false', () => {
      it('THEN the submit button should be disabled', () => {
        mockPlanFormCanSubmit = false
        renderCreateSubscription()

        const submitButton = screen.getByTestId('submit')

        expect(submitButton).toBeDisabled()
      })
    })

    describe('WHEN neither formik nor plan form is dirty', () => {
      it('THEN the submit button should be disabled', () => {
        mockPlanFormIsDirty = false
        mockPlanFormCanSubmit = true
        renderCreateSubscription()

        const submitButton = screen.getByTestId('submit')

        expect(submitButton).toBeDisabled()
      })
    })

    describe('WHEN planFormIsDirty is true and planFormCanSubmit is true', () => {
      it('THEN the submit button should be enabled', () => {
        mockPlanFormIsDirty = true
        mockPlanFormCanSubmit = true
        renderCreateSubscription()

        const submitButton = screen.getByTestId('submit')

        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN the close button behavior', () => {
    describe('WHEN planFormIsDirty is true and user clicks close', () => {
      it('THEN should not navigate away (warning dialog should intercept)', async () => {
        mockPlanFormIsDirty = true
        const user = userEvent.setup()
        renderCreateSubscription()

        const closeButton = screen.getByTestId('close-create-subscription-button')
        await user.click(closeButton)

        // Should NOT navigate away when form is dirty
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })

    describe('WHEN planFormIsDirty is false and formik is not dirty', () => {
      it('THEN should navigate away on close click', async () => {
        mockPlanFormIsDirty = false
        const user = userEvent.setup()
        renderCreateSubscription()

        const closeButton = screen.getByTestId('close-create-subscription-button')
        await user.click(closeButton)

        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })
})
