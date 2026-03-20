import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps } from 'formik'

import { ChargeModelEnum, CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { LocalFixedChargeInput, PlanFormInput } from '../../types'
import { FIXED_CHARGES_ADD_BUTTON_TEST_ID, FixedChargesSection } from '../FixedChargesSection'

// --- Mocks ---

const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/FixedChargeDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'fixed-charge-drawer-mock' })
  })

  MockedDrawer.displayName = 'FixedChargeDrawer'

  return { FixedChargeDrawer: MockedDrawer }
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

const createMockFixedCharge = (
  overrides: Partial<LocalFixedChargeInput> = {},
): LocalFixedChargeInput =>
  ({
    id: 'fixed-charge-1',
    chargeModel: ChargeModelEnum.Standard,
    invoiceDisplayName: 'Fixed Charge',
    payInAdvance: false,
    prorated: false,
    properties: { amount: '50' },
    addOn: {
      id: 'addon-1',
      name: 'Setup Fee',
      code: 'setup_fee',
    },
    taxes: [],
    ...overrides,
  }) as unknown as LocalFixedChargeInput

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

// --- Tests ---

describe('FixedChargesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN there are no fixed charges', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the add fixed charge button', () => {
        const formikProps = createFormikProps()

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        expect(screen.getByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the mocked drawer', () => {
        const formikProps = createFormikProps()

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        expect(screen.getByTestId('fixed-charge-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN isInSubscriptionForm is true', () => {
      it('THEN should return null', () => {
        const formikProps = createFormikProps()

        const { container } = render(
          <FixedChargesSection
            formikProps={formikProps}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.queryByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(container.querySelector('section')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are fixed charges', () => {
    const fixedCharge = createMockFixedCharge()

    describe('WHEN the component renders', () => {
      it('THEN should render fixed charge selectors', () => {
        const formikProps = createFormikProps({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        expect(screen.getByTestId('fixed-charge-selector-0')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the add button is visible', () => {
    describe('WHEN the user clicks the add fixed charge button', () => {
      it('THEN should open the drawer', async () => {
        const user = userEvent.setup()
        const formikProps = createFormikProps()

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        await user.click(screen.getByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith()
      })
    })
  })

  describe('GIVEN a fixed charge exists', () => {
    describe('WHEN the user clicks on a fixed charge selector', () => {
      it('THEN should open the drawer with the charge data', async () => {
        const user = userEvent.setup()
        const fixedCharge = createMockFixedCharge()
        const formikProps = createFormikProps({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        await user.click(screen.getByTestId('fixed-charge-selector-0'))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith(fixedCharge, 0, {
          alreadyUsedChargeAlertMessage: undefined,
          isUsedInSubscription: false,
        })
      })
    })
  })

  describe('GIVEN the plan interval is yearly', () => {
    describe('WHEN the component renders with fixed charges', () => {
      it('THEN should display the bill fixed charges monthly switch', () => {
        const fixedCharge = createMockFixedCharge()
        const formikProps = createFormikProps({
          fixedCharges: [fixedCharge],
          interval: PlanInterval.Yearly,
        })

        render(
          <FixedChargesSection formikProps={formikProps} alreadyExistingFixedChargesIds={[]} />,
        )

        // The Switch component renders an input with aria-label={name}
        const switchEl = screen.getByLabelText('billFixedChargesMonthly') as HTMLInputElement

        expect(switchEl).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the component is in subscription form', () => {
    describe('WHEN there are charges and isInSubscriptionForm is true', () => {
      it('THEN should not render the add button', () => {
        const fixedCharge = createMockFixedCharge()
        const formikProps = createFormikProps({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection
            formikProps={formikProps}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.queryByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should still render the charge selectors', () => {
        const fixedCharge = createMockFixedCharge()
        const formikProps = createFormikProps({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection
            formikProps={formikProps}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.getByTestId('fixed-charge-selector-0')).toBeInTheDocument()
      })
    })
  })
})
