import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'
import { createRef } from 'react'

import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { LocalUsageChargeInput, PlanFormInput } from '../types'
import { USAGE_CHARGES_ADD_BUTTON_TEST_ID, UsageChargesSection } from '../UsageChargesSection'

// --- Mocks ---

const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/UsageChargeDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'usage-charge-drawer-mock' })
  })

  MockedDrawer.displayName = 'UsageChargeDrawer'

  return { UsageChargeDrawer: MockedDrawer }
})

jest.mock('~/components/plans/RemoveChargeWarningDialog', () => {
  const React = jest.requireActual('react')

  const MockedDialog = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDialog: jest.fn(),
      closeDialog: jest.fn(),
    }))

    return React.createElement('div', { 'data-test': 'remove-charge-warning-dialog-mock' })
  })

  MockedDialog.displayName = 'RemoveChargeWarningDialog'

  return { RemoveChargeWarningDialog: MockedDialog, RemoveChargeWarningDialogRef: {} }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  useDuplicatePlanVar: () => ({ type: '' }),
  envGlobalVar: () => ({ sentryDsn: '', apiUrl: '', appVersion: '' }),
  initializeTranslations: jest.fn(),
}))

jest.mock('~/core/apolloClient/reactiveVars/duplicatePlanVar', () => ({
  useDuplicatePlanVar: () => ({ type: '' }),
}))

// --- Helpers ---

const createMockCharge = (overrides: Partial<LocalUsageChargeInput> = {}): LocalUsageChargeInput =>
  ({
    id: 'charge-1',
    chargeModel: ChargeModelEnum.Standard,
    invoiceDisplayName: 'Test Charge',
    payInAdvance: false,
    prorated: false,
    properties: { amount: '10' },
    billableMetric: {
      id: 'bm-1',
      name: 'API Calls',
      code: 'api_calls',
      aggregationType: AggregationTypeEnum.CountAgg,
      recurring: false,
      filters: [],
    },
    taxes: [],
    ...overrides,
  }) as unknown as LocalUsageChargeInput

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

const premiumWarningDialogRef = createRef<PremiumWarningDialogRef>()

// --- Tests ---

describe('UsageChargesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN there are no charges', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the add usage charge button', () => {
        const formikProps = createFormikProps()

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        expect(screen.getByTestId(USAGE_CHARGES_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the mocked drawer', () => {
        const formikProps = createFormikProps()

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        expect(screen.getByTestId('usage-charge-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN isInSubscriptionForm is true', () => {
      it('THEN should return null', () => {
        const formikProps = createFormikProps()

        const { container } = render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            isInSubscriptionForm
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        expect(screen.queryByTestId(USAGE_CHARGES_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
        // The component returns null when no charges and isInSubscriptionForm
        expect(container.querySelector('section')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are charges', () => {
    const charge = createMockCharge()

    describe('WHEN the component renders with metered charges', () => {
      it('THEN should render charge selectors', () => {
        const formikProps = createFormikProps({ charges: [charge] })

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        expect(screen.getByTestId('usage-charge-selector-0')).toBeInTheDocument()
      })

      it('THEN should not render recurring charges in metered section', () => {
        const recurringCharge = createMockCharge({
          id: 'charge-2',
          billableMetric: {
            id: 'bm-2',
            name: 'Storage',
            code: 'storage',
            aggregationType: AggregationTypeEnum.CountAgg,
            recurring: true,
            filters: [],
          },
        })
        const formikProps = createFormikProps({ charges: [recurringCharge] })

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        // Recurring charges should not render selectors in the metered section
        expect(screen.queryByTestId('usage-charge-selector-0')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the add button is visible', () => {
    describe('WHEN the user clicks the add usage charge button', () => {
      it('THEN should open the drawer', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps()

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        await user.click(screen.getByTestId(USAGE_CHARGES_ADD_BUTTON_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith()
      })
    })
  })

  describe('GIVEN a charge exists and is not in a subscription', () => {
    describe('WHEN the user clicks on a charge selector', () => {
      it('THEN should open the drawer with the charge data', async () => {
        const user = userEvent.setup()
        const charge = createMockCharge()
        const formikProps = createFormikProps({ charges: [charge] })

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        await user.click(screen.getByTestId('usage-charge-selector-0'))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith(charge, 0, {
          alreadyUsedChargeAlertMessage: undefined,
          initialCharge: undefined,
          isUsedInSubscription: false,
        })
      })
    })
  })

  describe('GIVEN the plan interval is yearly', () => {
    describe('WHEN the component renders with charges', () => {
      it('THEN should display the bill charges monthly switch', () => {
        const charge = createMockCharge()
        const formikProps = createFormikProps({
          charges: [charge],
          interval: PlanInterval.Yearly,
        })

        render(
          <UsageChargesSection
            formikProps={formikProps}
            isEdition={false}
            premiumWarningDialogRef={premiumWarningDialogRef}
          />,
        )

        // The Switch component renders an input with aria-label={name}
        const switchEl = screen.getByLabelText('billChargesMonthly') as HTMLInputElement

        expect(switchEl).toBeInTheDocument()
      })
    })
  })
})
