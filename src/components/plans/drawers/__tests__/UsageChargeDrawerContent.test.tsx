import { screen } from '@testing-library/react'

import { ChargeModelEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { UsageChargeDrawerContent as OriginalUsageChargeDrawerContent } from '../UsageChargeDrawerContent'

// Cast to strip the injected `form` prop that withForm adds to the type
const UsageChargeDrawerContent = OriginalUsageChargeDrawerContent as unknown as React.FC<{
  isCreateMode: boolean
  isEdition?: boolean
  disabled?: boolean
  isInSubscriptionForm?: boolean
  amountCurrency?: string
  editIndex: number
  initialCharge?: unknown
  alreadyUsedChargeAlertMessage?: string
  currency: string
  interval: string
}>

// --- Test ID constants ---

const CHARGE_MODEL_SELECTOR_TEST_ID = 'charge-model-selector'
const CHARGE_WRAPPER_SWITCH_TEST_ID = 'charge-wrapper-switch'
const PLAN_BILLING_PERIOD_INFO_SECTION_TEST_ID = 'plan-billing-period-info-section'
const CHARGE_PAY_IN_ADVANCE_OPTION_TEST_ID = 'charge-pay-in-advance-option'
const TAXES_SELECTOR_SECTION_TEST_ID = 'taxes-selector-section'
const BM_PICKER_COMBOBOX_TEST_ID = 'bm-picker-combobox'

// --- Mocks ---

const mockFormReset = jest.fn()
const mockSetFieldValue = jest.fn()
const mockGetFieldValue = jest.fn()

const mockDefaultFormValues = {
  billableMetricId: '',
  billableMetric: {
    id: '',
    name: '',
    code: '',
    aggregationType: 'count_agg',
    recurring: false,
  },
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: '',
  invoiceable: true,
  minAmountCents: '',
  payInAdvance: false,
  prorated: false,
  properties: { amount: '', packageSize: '' },
  filters: [] as {
    values: string[]
    properties: Record<string, string>
    invoiceDisplayName: string
  }[],
  regroupPaidFees: null,
  taxes: [] as { id: string; code: string; name: string; rate: number }[],
}

const mockEditFormValues = {
  billableMetricId: 'bm-1',
  billableMetric: {
    id: 'bm-1',
    name: 'API Calls',
    code: 'api_calls',
    aggregationType: 'count_agg',
    recurring: false,
  },
  chargeModel: ChargeModelEnum.Standard,
  invoiceDisplayName: '',
  invoiceable: true,
  minAmountCents: '',
  payInAdvance: false,
  prorated: false,
  properties: { amount: '10', packageSize: '' },
  filters: [] as {
    values: string[]
    properties: Record<string, string>
    invoiceDisplayName: string
  }[],
  regroupPaidFees: null,
  taxes: [] as { id: string; code: string; name: string; rate: number }[],
}

const mockEditFormValuesWithFilters = {
  ...mockEditFormValues,
  billableMetric: {
    ...mockEditFormValues.billableMetric,
    filters: [{ id: 'f1', key: 'region', values: ['us', 'eu'] }],
  },
  filters: [
    {
      values: ['{"region":"us"}'],
      properties: { amount: '5', packageSize: '' },
      invoiceDisplayName: '',
    },
  ],
}

let mockCurrentFormValues = mockDefaultFormValues

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
        />
      ),
      ComboBoxField: (props: Record<string, unknown>) => (
        <div data-test={BM_PICKER_COMBOBOX_TEST_ID} data-placeholder={props.placeholder as string}>
          combobox
        </div>
      ),
      SwitchField: (props: Record<string, unknown>) => (
        <input type="checkbox" data-test={`field-${name}`} aria-label={props.label as string} />
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

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({ hasAnyPricingUnitConfigured: false }),
}))

jest.mock('~/hooks/plans/useChargeForm', () => ({
  useChargeForm: () => ({
    getUsageChargeModelComboboxData: jest.fn(() => []),
    getIsPayInAdvanceOptionDisabledForUsageCharge: jest.fn(() => false),
    getIsProRatedOptionDisabledForUsageCharge: jest.fn(() => false),
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
    useGetMeteredBillableMetricsLazyQuery: jest.fn(() => [jest.fn(), { data: null }]),
    useGetRecurringBillableMetricsLazyQuery: jest.fn(() => [jest.fn(), { data: null }]),
  }
})

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({
    open: jest.fn(),
    close: jest.fn(),
  }),
}))

jest.mock('~/components/drawers/const', () => ({
  DRAWER_TRANSITION_DURATION: 0,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeModelSelector', () => ({
  ChargeModelSelector: () => <div data-test={CHARGE_MODEL_SELECTOR_TEST_ID} />,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeWrapperSwitch', () => ({
  ChargeWrapperSwitch: () => <div data-test={CHARGE_WRAPPER_SWITCH_TEST_ID} />,
}))

jest.mock('~/components/plans/chargeAccordion/CustomPricingUnitSelector', () => ({
  CustomPricingUnitSelector: () => <div data-test="custom-pricing-unit-selector" />,
}))

jest.mock('~/components/plans/drawers/PlanBillingPeriodInfoSection', () => ({
  PlanBillingPeriodInfoSection: () => <div data-test={PLAN_BILLING_PERIOD_INFO_SECTION_TEST_ID} />,
}))

jest.mock('~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption', () => ({
  ChargePayInAdvanceOption: () => <div data-test={CHARGE_PAY_IN_ADVANCE_OPTION_TEST_ID} />,
}))

jest.mock('~/components/plans/chargeAccordion/options/ChargeInvoicingStrategyOption', () => ({
  ChargeInvoicingStrategyOption: () => <div data-test="charge-invoicing-strategy-option" />,
}))

jest.mock('~/components/plans/chargeAccordion/SpendingMinimumOptionSection', () => ({
  SpendingMinimumOptionSection: () => <div data-test="spending-minimum-option-section" />,
}))

jest.mock('~/components/taxes/TaxesSelectorSection', () => ({
  TaxesSelectorSection: () => <div data-test={TAXES_SELECTOR_SECTION_TEST_ID} />,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeFilter', () => ({
  ChargeFilter: () => <div data-test="charge-filter" />,
  buildChargeFilterAddFilterButtonId: jest.fn(() => 'filter-btn-id'),
}))

jest.mock('~/components/plans/drawers/ChargeFilterDrawerContent', () => ({
  ChargeFilterDrawerContent: () => <div data-test="charge-filter-drawer-content" />,
  chargeFilterDrawerSchema: {},
}))

jest.mock('~/contexts/ChargeFilterDrawerContext', () => ({
  ChargeFilterDrawerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('~/components/plans/utils', () => ({
  mapChargeIntervalCopy: jest.fn(() => ({})),
}))

// --- Tests ---

describe('UsageChargeDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCurrentFormValues = mockDefaultFormValues
    mockForm.store = mockCreateStore(mockDefaultFormValues)
    mockForm.state = { values: mockDefaultFormValues }
  })

  describe('GIVEN create mode with no billable metric selected', () => {
    describe('WHEN it renders', () => {
      it('THEN should render the billable metric picker combobox', () => {
        mockCurrentFormValues = mockDefaultFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode
            editIndex={-1}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(BM_PICKER_COMBOBOX_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should NOT render the charge model selector', () => {
        mockCurrentFormValues = mockDefaultFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode
            editIndex={-1}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.queryByTestId(CHARGE_MODEL_SELECTOR_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN edit mode with a billable metric selected', () => {
    describe('WHEN it renders', () => {
      it('THEN should render the charge model selector', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(CHARGE_MODEL_SELECTOR_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the charge wrapper switch', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(CHARGE_WRAPPER_SWITCH_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should NOT render the billable metric picker combobox', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.queryByTestId(BM_PICKER_COMBOBOX_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a billable metric with filters', () => {
    describe('WHEN filters are present on the charge', () => {
      it('THEN should render filter selectors', () => {
        mockCurrentFormValues = mockEditFormValuesWithFilters

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId('filter-charge-selector-0')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the invoicing section renders', () => {
    describe('WHEN the component is in edit mode', () => {
      it('THEN should render PlanBillingPeriodInfoSection', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(PLAN_BILLING_PERIOD_INFO_SECTION_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render ChargePayInAdvanceOption', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(CHARGE_PAY_IN_ADVANCE_OPTION_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render TaxesSelectorSection', () => {
        mockCurrentFormValues = mockEditFormValues

        render(
          <UsageChargeDrawerContent
            isCreateMode={false}
            editIndex={0}
            currency="USD"
            interval="monthly"
          />,
        )

        expect(screen.getByTestId(TAXES_SELECTOR_SECTION_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
