import { screen } from '@testing-library/react'

import { FixedChargeChargeModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { FixedChargeDrawerContent as OriginalFixedChargeDrawerContent } from '../FixedChargeDrawerContent'

// Cast to strip the injected `form` prop that withForm adds to the type
const FixedChargeDrawerContent = OriginalFixedChargeDrawerContent as unknown as React.FC<{
  isCreateMode: boolean
  isEdition?: boolean
  disabled?: boolean
  isInSubscriptionForm?: boolean
  alertMessage?: string
}>

// --- Test ID constants ---

const CHARGE_MODEL_SELECTOR_TEST_ID = 'charge-model-selector'
const CHARGE_WRAPPER_SWITCH_TEST_ID = 'charge-wrapper-switch'
const CHARGE_PAY_IN_ADVANCE_OPTION_TEST_ID = 'charge-pay-in-advance-option'

// --- Mock form values ---

const mockDefaultFormValues = {
  addOnId: '',
  addOn: { id: '', name: '', code: '' },
  applyUnitsImmediately: false,
  chargeModel: FixedChargeChargeModelEnum.Standard,
  id: undefined as string | undefined,
  invoiceDisplayName: '',
  payInAdvance: false,
  properties: { amount: '', packageSize: '' },
  prorated: false,
  taxes: [] as { id: string; code: string; name: string; rate: number }[],
  units: '',
}

const mockExistingChargeFormValues = {
  ...mockDefaultFormValues,
  addOnId: 'addon-1',
  addOn: { id: 'addon-1', name: 'Setup Fee', code: 'setup_fee' },
  id: 'charge-1', // Has an id = existing charge persisted on backend
  properties: { amount: '100', packageSize: '' },
  units: '5',
}

const mockNewChargeFormValues = {
  ...mockDefaultFormValues,
  addOnId: 'addon-2',
  addOn: { id: 'addon-2', name: 'New Fee', code: 'new_fee' },
  id: undefined, // No id = new charge not yet persisted
  properties: { amount: '50', packageSize: '' },
  units: '1',
}

let mockCurrentFormValues: typeof mockDefaultFormValues = mockDefaultFormValues

// --- Mocks ---

const mockFormReset = jest.fn()
const mockSetFieldValue = jest.fn()
const mockGetFieldValue = jest.fn()

const mockCreateStore = (values: Record<string, unknown>) => ({
  subscribe: jest.fn((cb: () => void) => {
    cb()
    return () => {}
  }),
  listeners: new Set(),
  state: { values },
})

const mockForm = {
  reset: mockFormReset,
  setFieldValue: mockSetFieldValue,
  getFieldValue: mockGetFieldValue,
  store: mockCreateStore(mockDefaultFormValues),
  state: { values: mockDefaultFormValues },
  AppField: ({
    children,
    name,
  }: {
    children: (field: unknown) => React.ReactNode
    name: string
  }) => {
    const mockFieldApi = {
      state: { meta: { errors: [] } },
      TextInputField: (props: Record<string, unknown>) => (
        <input
          data-test={`field-${name}`}
          placeholder={props.placeholder as string}
          aria-label={props.label as string}
          disabled={!!props.disabled}
        />
      ),
      ComboBoxField: (props: Record<string, unknown>) => (
        <div data-test={`field-${name}`} data-placeholder={props.placeholder as string}>
          combobox
        </div>
      ),
      SwitchField: (props: Record<string, unknown>) => (
        <input
          type="checkbox"
          data-test={`field-${name}`}
          aria-label={props.label as string}
          disabled={!!props.disabled}
        />
      ),
      AmountInputField: (props: Record<string, unknown>) => (
        <input
          data-test={`field-${name}`}
          aria-label={props.label as string}
          disabled={!!props.disabled}
        />
      ),
    }

    return <div data-field-name={name}>{children(mockFieldApi)}</div>
  },
}

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((_store: unknown, selector: (state: unknown) => unknown) =>
    selector({ values: mockCurrentFormValues }),
  ),
  revalidateLogic: jest.fn(() => ({})),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: jest.fn(() => mockForm),
  withForm: jest.fn((mockOpts: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockRenderFn = mockOpts.render as (mockArgs: Record<string, unknown>) => any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mockProps: Record<string, unknown>) => mockRenderFn({ ...mockProps, form: mockForm })
  }),
  withFieldGroup: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

jest.mock('~/hooks/plans/useChargeForm', () => ({
  useChargeForm: () => ({
    getFixedChargeModelComboboxData: jest.fn(() => []),
    getIsPayInAdvanceOptionDisabledForFixedCharge: jest.fn(() => false),
    getIsProRatedOptionDisabledForFixedCharge: jest.fn(() => false),
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  envGlobalVar: () => ({ sentryDsn: '', apiUrl: '', appVersion: '' }),
  initializeTranslations: jest.fn(),
}))

jest.mock('~/core/serializers/getPropertyShape', () => ({
  __esModule: true,
  default: () => ({ amount: '', packageSize: '' }),
}))

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (c: string) => c,
  intlFormatNumber: jest.fn(),
}))

jest.mock('~/formValidation/chargePropertiesSchema', () => ({
  validateChargeProperties: jest.fn(),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetAddOnsForFixedChargesSectionLazyQuery: jest.fn(() => [
      jest.fn(),
      { loading: false, data: null },
    ]),
  }
})

// Prop-capturing mocks for child components
let lastChargeModelSelectorProps: Record<string, unknown> = {}
let lastChargeWrapperSwitchProps: Record<string, unknown> = {}
let lastChargePayInAdvanceOptionProps: Record<string, unknown> = {}

jest.mock('~/components/plans/chargeAccordion/ChargeModelSelector', () => ({
  ChargeModelSelector: (props: Record<string, unknown>) => {
    lastChargeModelSelectorProps = props
    return (
      <div data-test={CHARGE_MODEL_SELECTOR_TEST_ID} data-disabled={String(!!props.disabled)} />
    )
  },
}))

jest.mock('~/components/plans/chargeAccordion/ChargeWrapperSwitch', () => ({
  ChargeWrapperSwitch: (props: Record<string, unknown>) => {
    lastChargeWrapperSwitchProps = props
    return (
      <div data-test={CHARGE_WRAPPER_SWITCH_TEST_ID} data-disabled={String(!!props.disabled)} />
    )
  },
}))

jest.mock('~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption', () => ({
  ChargePayInAdvanceOption: (props: Record<string, unknown>) => {
    lastChargePayInAdvanceOptionProps = props
    return (
      <div
        data-test={CHARGE_PAY_IN_ADVANCE_OPTION_TEST_ID}
        data-disabled={String(!!props.disabled)}
      />
    )
  },
}))

jest.mock('~/components/plans/drawers/common/PlanBillingPeriodInfoSection', () => ({
  PlanBillingPeriodInfoSection: () => <div data-test="plan-billing-period-info-section" />,
}))

jest.mock('~/components/taxes/TaxesSelectorSection', () => ({
  TaxesSelectorSection: () => <div data-test="taxes-selector-section" />,
}))

jest.mock('~/contexts/PlanFormContext', () => {
  const { CurrencyEnum } = jest.requireActual('~/generated/graphql')

  return {
    PlanFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    usePlanFormContext: () => ({
      currency: CurrencyEnum.Usd,
      interval: 'monthly',
    }),
  }
})

// --- Tests ---

describe('FixedChargeDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentFormValues = mockDefaultFormValues
    mockForm.store = mockCreateStore(mockDefaultFormValues)
    mockForm.state = { values: mockDefaultFormValues }
    lastChargeModelSelectorProps = {}
    lastChargeWrapperSwitchProps = {}
    lastChargePayInAdvanceOptionProps = {}
  })

  describe('GIVEN a plan with subscriptions and an EXISTING fixed charge', () => {
    beforeEach(() => {
      mockCurrentFormValues = mockExistingChargeFormValues
      mockForm.store = mockCreateStore(mockExistingChargeFormValues)
      mockForm.state = { values: mockExistingChargeFormValues }
    })

    describe('WHEN disabled=true (plan has subscriptions)', () => {
      const renderExistingChargeOnSubscribedPlan = () =>
        render(<FixedChargeDrawerContent isCreateMode={false} isEdition disabled />)

      it('THEN ChargeModelSelector should be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        expect(lastChargeModelSelectorProps.disabled).toBe(true)
      })

      it('THEN ChargeWrapperSwitch (pricing fields) should NOT be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        expect(lastChargeWrapperSwitchProps.disabled).toBeFalsy()
      })

      it('THEN units field should NOT be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        const unitsField = screen.getByTestId('field-units')

        expect(unitsField).not.toBeDisabled()
      })

      it('THEN applyUnitsImmediately switch should NOT be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        const applyUnitsSwitch = screen.getByTestId('field-applyUnitsImmediately')

        expect(applyUnitsSwitch).not.toBeDisabled()
      })

      it('THEN ChargePayInAdvanceOption should be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        expect(lastChargePayInAdvanceOptionProps.disabled).toBe(true)
      })

      it('THEN prorated switch should be disabled', () => {
        renderExistingChargeOnSubscribedPlan()

        const proratedField = screen.getByTestId('field-prorated')

        expect(proratedField).toBeDisabled()
      })
    })
  })

  describe('GIVEN a plan with subscriptions and a NEW fixed charge (no id)', () => {
    beforeEach(() => {
      mockCurrentFormValues = mockNewChargeFormValues
      mockForm.store = mockCreateStore(mockNewChargeFormValues)
      mockForm.state = { values: mockNewChargeFormValues }
    })

    describe('WHEN disabled=true (plan has subscriptions) but charge has no id', () => {
      const renderNewChargeOnSubscribedPlan = () =>
        render(<FixedChargeDrawerContent isCreateMode={false} isEdition disabled />)

      it('THEN ChargeModelSelector should NOT be disabled (new charge)', () => {
        renderNewChargeOnSubscribedPlan()

        expect(lastChargeModelSelectorProps.disabled).toBe(false)
      })

      it('THEN ChargeWrapperSwitch should NOT be disabled', () => {
        renderNewChargeOnSubscribedPlan()

        expect(lastChargeWrapperSwitchProps.disabled).toBeFalsy()
      })

      it('THEN units field should NOT be disabled', () => {
        renderNewChargeOnSubscribedPlan()

        const unitsField = screen.getByTestId('field-units')

        expect(unitsField).not.toBeDisabled()
      })

      it('THEN ChargePayInAdvanceOption should NOT be disabled', () => {
        renderNewChargeOnSubscribedPlan()

        expect(lastChargePayInAdvanceOptionProps.disabled).toBe(false)
      })

      it('THEN prorated switch should NOT be disabled', () => {
        renderNewChargeOnSubscribedPlan()

        const proratedField = screen.getByTestId('field-prorated')

        expect(proratedField).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN a plan WITHOUT subscriptions', () => {
    beforeEach(() => {
      mockCurrentFormValues = mockExistingChargeFormValues
      mockForm.store = mockCreateStore(mockExistingChargeFormValues)
      mockForm.state = { values: mockExistingChargeFormValues }
    })

    describe('WHEN disabled=false', () => {
      const renderChargeOnPlanWithoutSubscriptions = () =>
        render(<FixedChargeDrawerContent isCreateMode={false} isEdition disabled={false} />)

      it('THEN ChargeModelSelector should NOT be disabled', () => {
        renderChargeOnPlanWithoutSubscriptions()

        expect(lastChargeModelSelectorProps.disabled).toBe(false)
      })

      it('THEN ChargeWrapperSwitch should NOT be disabled', () => {
        renderChargeOnPlanWithoutSubscriptions()

        expect(lastChargeWrapperSwitchProps.disabled).toBeFalsy()
      })

      it('THEN units field should NOT be disabled', () => {
        renderChargeOnPlanWithoutSubscriptions()

        const unitsField = screen.getByTestId('field-units')

        expect(unitsField).not.toBeDisabled()
      })

      it('THEN ChargePayInAdvanceOption should NOT be disabled', () => {
        renderChargeOnPlanWithoutSubscriptions()

        expect(lastChargePayInAdvanceOptionProps.disabled).toBe(false)
      })

      it('THEN prorated switch should NOT be disabled', () => {
        renderChargeOnPlanWithoutSubscriptions()

        const proratedField = screen.getByTestId('field-prorated')

        expect(proratedField).not.toBeDisabled()
      })
    })
  })
})
