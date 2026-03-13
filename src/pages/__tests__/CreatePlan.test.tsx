import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import CreatePlan from '../CreatePlan'

// --- Mocks ---

const mockSetFieldValue = jest.fn()
const mockSetValues = jest.fn()
const mockSubmitForm = jest.fn()

let mockFormikValues: Record<string, unknown> = {}
let mockIsEdition = false
let mockLoading = false
let mockDirty = false
let mockPlan: Record<string, unknown> | undefined
let mockType = 'creation'

jest.mock('~/hooks/plans/usePlanForm', () => ({
  usePlanForm: () => {
    const defaultValues = {
      name: 'Test Plan',
      code: 'test-plan',
      description: '',
      interval: 'monthly',
      payInAdvance: false,
      amountCents: '100',
      amountCurrency: 'USD',
      trialPeriod: 0,
      taxes: [],
      billChargesMonthly: false,
      billFixedChargesMonthly: false,
      charges: [],
      fixedCharges: [],
      minimumCommitment: {},
      invoiceDisplayName: '',
      entitlements: [],
      ...mockFormikValues,
    }

    return {
      formikProps: {
        values: defaultValues,
        initialValues: defaultValues,
        errors: {},
        touched: {},
        isSubmitting: false,
        isValidating: false,
        submitCount: 0,
        dirty: mockDirty,
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
        setFieldValue: mockSetFieldValue,
        setFormikState: jest.fn(),
        setStatus: jest.fn(),
        setSubmitting: jest.fn(),
        setTouched: jest.fn(),
        setValues: mockSetValues,
        submitForm: mockSubmitForm,
        validateForm: jest.fn(),
        validateField: jest.fn(),
        getFieldHelpers: jest.fn(),
        getFieldMeta: jest.fn(),
        getFieldProps: jest.fn(),
        registerField: jest.fn(),
        unregisterField: jest.fn(),
      },
      isEdition: mockIsEdition,
      loading: mockLoading,
      plan: mockPlan,
      type: mockType,
    }
  },
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  useDuplicatePlanVar: () => ({ type: mockType }),
}))

jest.mock('~/core/apolloClient/reactiveVars/duplicatePlanVar', () => ({
  ...jest.requireActual('~/core/apolloClient/reactiveVars/duplicatePlanVar'),
  useDuplicatePlanVar: () => ({ type: mockType }),
}))

// Mock all child sections to isolate CreatePlan logic
jest.mock('~/components/plans/PlanSettingsSection', () => {
  const React = jest.requireActual('react')

  return {
    PlanSettingsSection: () =>
      React.createElement('div', { 'data-test': 'plan-settings-section-mock' }),
  }
})

jest.mock('~/components/plans/SubscriptionFeeSection', () => {
  const React = jest.requireActual('react')

  return {
    SubscriptionFeeSection: (props: { onDrawerSave: (v: unknown) => void }) =>
      React.createElement(
        'div',
        { 'data-test': 'subscription-fee-section-mock' },
        React.createElement(
          'button',
          {
            'data-test': 'trigger-subscription-fee-save',
            onClick: () =>
              props.onDrawerSave({
                amountCents: '500',
                payInAdvance: true,
                trialPeriod: 7,
                invoiceDisplayName: 'Sub Fee',
              }),
          },
          'Save Fee',
        ),
      ),
  }
})

jest.mock('~/components/plans/form/FixedChargesSection', () => {
  const React = jest.requireActual('react')

  return {
    FixedChargesSection: () =>
      React.createElement('div', { 'data-test': 'fixed-charges-section-mock' }),
  }
})

jest.mock('~/components/plans/UsageChargesSection', () => {
  const React = jest.requireActual('react')

  return {
    UsageChargesSection: () =>
      React.createElement('div', { 'data-test': 'usage-charges-section-mock' }),
  }
})

jest.mock('~/components/plans/ProgressiveBillingSection', () => {
  const React = jest.requireActual('react')

  return {
    ProgressiveBillingSection: () =>
      React.createElement('div', { 'data-test': 'progressive-billing-section-mock' }),
  }
})

jest.mock('~/components/plans/CommitmentsSection', () => {
  const React = jest.requireActual('react')

  return {
    CommitmentsSection: (props: { onDrawerSave: (v: unknown) => void }) =>
      React.createElement(
        'div',
        { 'data-test': 'commitments-section-mock' },
        React.createElement(
          'button',
          {
            'data-test': 'trigger-commitment-save',
            onClick: () =>
              props.onDrawerSave({
                amountCents: '1000',
                invoiceDisplayName: 'Commitment',
                taxes: [],
              }),
          },
          'Save Commitment',
        ),
      ),
  }
})

jest.mock('~/components/plans/FeatureEntitlementSection', () => {
  const React = jest.requireActual('react')

  return {
    FeatureEntitlementSection: (props: { onDrawerSave: (v: unknown) => void }) =>
      React.createElement(
        'div',
        { 'data-test': 'feature-entitlement-section-mock' },
        React.createElement(
          'button',
          {
            'data-test': 'trigger-entitlement-save-new',
            onClick: () =>
              props.onDrawerSave({
                featureId: 'feat-1',
                featureName: 'Feature 1',
                featureCode: 'feat_1',
                privileges: [],
              }),
          },
          'Save Entitlement',
        ),
        React.createElement(
          'button',
          {
            'data-test': 'trigger-entitlement-save-existing',
            onClick: () =>
              props.onDrawerSave({
                featureId: 'feat-existing',
                featureName: 'Existing Feature',
                featureCode: 'existing_code',
                privileges: [{ privilegeCode: 'p1', value: 'true' }],
              }),
          },
          'Update Entitlement',
        ),
      ),
  }
})

jest.mock('~/components/designSystem/WarningDialog', () => {
  const React = jest.requireActual('react')
  const mockOpenDialog = jest.fn()

  const MockWarningDialog = React.forwardRef((props: { onContinue?: () => void }, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDialog: () => {
        mockOpenDialog()
        props.onContinue?.()
      },
    }))

    return React.createElement('div', { 'data-test': 'warning-dialog-mock' })
  })

  MockWarningDialog.displayName = 'WarningDialog'

  return { WarningDialog: MockWarningDialog, WarningDialogRef: {} }
})

jest.mock('~/components/plans/ImpactOverridenSubscriptionsDialog', () => {
  const React = jest.requireActual('react')

  const MockDialog = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ openDialog: jest.fn() }))

    return React.createElement('div', { 'data-test': 'impact-dialog-mock' })
  })

  MockDialog.displayName = 'ImpactOverridenSubscriptionsDialog'

  return { ImpactOverridenSubscriptionsDialog: MockDialog }
})

jest.mock('~/components/invoices/EditInvoiceDisplayNameDialog', () => {
  const React = jest.requireActual('react')

  const MockDialog = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ openDialog: jest.fn() }))

    return React.createElement('div', { 'data-test': 'edit-invoice-name-dialog-mock' })
  })

  MockDialog.displayName = 'EditInvoiceDisplayNameDialog'

  return { EditInvoiceDisplayNameDialog: MockDialog }
})

jest.mock('~/components/PremiumWarningDialog', () => {
  const React = jest.requireActual('react')

  const MockDialog = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ openDialog: jest.fn() }))

    return React.createElement('div', { 'data-test': 'premium-warning-dialog-mock' })
  })

  MockDialog.displayName = 'PremiumWarningDialog'

  return { PremiumWarningDialog: MockDialog }
})

jest.mock('~/styles/mainObjectsForm', () => {
  const React = jest.requireActual('react')

  return {
    FormLoadingSkeleton: ({ id }: { id: string }) =>
      React.createElement('div', { 'data-test': `loading-skeleton-${id}` }),
  }
})

describe('CreatePlan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFormikValues = {}
    mockIsEdition = false
    mockLoading = false
    mockDirty = false
    mockPlan = undefined
    mockType = 'creation'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the page is loading', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display the loading skeleton', () => {
        mockLoading = true

        render(<CreatePlan />)

        expect(screen.getByTestId('loading-skeleton-create-plan')).toBeInTheDocument()
      })

      it('THEN should not display the form sections', () => {
        mockLoading = true

        render(<CreatePlan />)

        expect(screen.queryByTestId('plan-settings-section-mock')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is loaded in creation mode', () => {
    describe('WHEN the component is rendered', () => {
      it.each([
        ['PlanSettingsSection', 'plan-settings-section-mock'],
        ['SubscriptionFeeSection', 'subscription-fee-section-mock'],
        ['FixedChargesSection', 'fixed-charges-section-mock'],
        ['UsageChargesSection', 'usage-charges-section-mock'],
        ['ProgressiveBillingSection', 'progressive-billing-section-mock'],
        ['CommitmentsSection', 'commitments-section-mock'],
        ['FeatureEntitlementSection', 'feature-entitlement-section-mock'],
      ])('THEN should render %s', (_, testId) => {
        render(<CreatePlan />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should render the submit button', () => {
        render(<CreatePlan />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })

      it('THEN should render the close button', () => {
        render(<CreatePlan />)

        expect(screen.getByTestId('close-create-plan-button')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the handleSubscriptionFeeSave callback', () => {
    describe('WHEN the subscription fee drawer saves', () => {
      it('THEN should call setValues with the new subscription fee values', async () => {
        const user = userEvent.setup()

        render(<CreatePlan />)

        await user.click(screen.getByTestId('trigger-subscription-fee-save'))

        expect(mockSetValues).toHaveBeenCalledWith(
          expect.objectContaining({
            amountCents: '500',
            payInAdvance: true,
            trialPeriod: 7,
            invoiceDisplayName: 'Sub Fee',
          }),
        )
      })
    })
  })

  describe('GIVEN the handleMinimumCommitmentSave callback', () => {
    describe('WHEN the commitment drawer saves', () => {
      it('THEN should call setFieldValue with minimumCommitment including commitmentType', async () => {
        const user = userEvent.setup()

        render(<CreatePlan />)

        await user.click(screen.getByTestId('trigger-commitment-save'))

        expect(mockSetFieldValue).toHaveBeenCalledWith(
          'minimumCommitment',
          expect.objectContaining({
            amountCents: '1000',
            invoiceDisplayName: 'Commitment',
            commitmentType: 'minimum_commitment',
          }),
        )
      })
    })
  })

  describe('GIVEN the handleEntitlementDrawerSave callback', () => {
    describe('WHEN a new entitlement is saved', () => {
      it('THEN should append the entitlement to the list', async () => {
        const user = userEvent.setup()

        render(<CreatePlan />)

        await user.click(screen.getByTestId('trigger-entitlement-save-new'))

        expect(mockSetFieldValue).toHaveBeenCalledWith('entitlements', [
          {
            featureId: 'feat-1',
            featureName: 'Feature 1',
            featureCode: 'feat_1',
            privileges: [],
          },
        ])
      })
    })

    describe('WHEN an existing entitlement is updated', () => {
      it('THEN should replace the matching entitlement', async () => {
        const user = userEvent.setup()

        mockFormikValues = {
          entitlements: [
            {
              featureId: 'feat-existing',
              featureName: 'Old Name',
              featureCode: 'existing_code',
              privileges: [],
            },
          ],
        }

        render(<CreatePlan />)

        await user.click(screen.getByTestId('trigger-entitlement-save-existing'))

        expect(mockSetFieldValue).toHaveBeenCalledWith('entitlements', [
          {
            featureId: 'feat-existing',
            featureName: 'Existing Feature',
            featureCode: 'existing_code',
            privileges: [{ privilegeCode: 'p1', value: 'true' }],
          },
        ])
      })
    })
  })

  describe('GIVEN the submit button', () => {
    describe('WHEN clicked in creation mode', () => {
      it('THEN should call submitForm', async () => {
        const user = userEvent.setup()

        render(<CreatePlan />)

        await user.click(screen.getByTestId('submit'))

        expect(mockSubmitForm).toHaveBeenCalled()
      })
    })

    describe('WHEN the form is in edition mode and not dirty', () => {
      it('THEN should disable the submit button', () => {
        mockIsEdition = true
        mockDirty = false

        render(<CreatePlan />)

        expect(screen.getByTestId('submit')).toBeDisabled()
      })
    })
  })

  describe('GIVEN the close button', () => {
    describe('WHEN clicked and the form is not dirty', () => {
      it('THEN should navigate away', async () => {
        const user = userEvent.setup()

        mockPlan = { id: 'plan-123' }

        render(<CreatePlan />)

        await user.click(screen.getByTestId('close-create-plan-button'))

        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the sticky footer', () => {
    describe('WHEN loading is true and plan is undefined', () => {
      it('THEN should not render the footer buttons', () => {
        mockLoading = true
        mockPlan = undefined

        render(<CreatePlan />)

        expect(screen.queryByTestId('submit')).not.toBeInTheDocument()
      })
    })

    describe('WHEN loading is true but plan exists', () => {
      it('THEN should render the footer buttons', () => {
        mockLoading = true
        mockPlan = { id: 'plan-123' }

        render(<CreatePlan />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })
    })
  })
})
