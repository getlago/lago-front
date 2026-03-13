import { render } from '@testing-library/react'
import { createRef } from 'react'

import { useFieldContext } from '~/hooks/forms/formContext'

import {
  UsageChargeDrawer,
  UsageChargeDrawerFormValues,
  UsageChargeDrawerRef,
} from '../UsageChargeDrawer'

// --- Capture callbacks ---

let capturedOnSubmit: ((args: { value: Record<string, unknown> }) => void) | undefined
let capturedDefaultValues: Record<string, unknown> | undefined

// --- Mocks ---

jest.mock('~/components/designSystem/Drawer', () => {
  const React = jest.requireActual('react')

  const MockDrawer = React.forwardRef(({ children }: { children: unknown }, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: jest.fn(),
      closeDrawer: jest.fn(),
    }))

    return (
      <div data-test="mocked-drawer">
        {typeof children === 'function' ? children({ closeDrawer: jest.fn() }) : children}
      </div>
    )
  })

  MockDrawer.displayName = 'Drawer'

  return { Drawer: MockDrawer, DRAWER_TRANSITION_DURATION: 0 }
})

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/contexts/PlanFormContext', () => {
  const { CurrencyEnum, PlanInterval: mockedPlanInterval } =
    jest.requireActual('~/generated/graphql')

  return {
    usePlanFormContext: () => ({
      currency: CurrencyEnum.Usd,
      interval: mockedPlanInterval.Monthly,
    }),
  }
})

jest.mock('~/hooks/plans/useCustomPricingUnits', () => ({
  useCustomPricingUnits: () => ({ hasAnyPricingUnitConfigured: false }),
}))

jest.mock('~/core/apolloClient', () => ({
  useDuplicatePlanVar: () => ({ type: '' }),
  envGlobalVar: () => ({ sentryDsn: '', apiUrl: '', appVersion: '' }),
}))

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (c: string) => c,
  intlFormatNumber: jest.fn(),
}))

jest.mock('~/core/serializers/getPropertyShape', () => ({
  __esModule: true,
  default: () => ({ amount: '', packageSize: '' }),
}))

jest.mock('~/core/utils/domUtils', () => ({
  scrollToAndClickElement: jest.fn(),
}))

jest.mock('~/formValidation/chargePropertiesSchema', () => ({
  validateChargeProperties: jest.fn(),
}))

jest.mock('~/hooks/plans/useChargeForm', () => ({
  useChargeForm: () => ({
    getUsageChargeModelComboboxData: jest.fn(() => []),
    getIsPayInAdvanceOptionDisabledForUsageCharge: jest.fn(() => false),
    getIsProRatedOptionDisabledForUsageCharge: jest.fn(() => false),
  }),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetMeteredBillableMetricsLazyQuery: jest.fn(() => [jest.fn(), { data: null }]),
    useGetRecurringBillableMetricsLazyQuery: jest.fn(() => [jest.fn(), { data: null }]),
  }
})

jest.mock('~/components/plans/drawers/PlanBillingPeriodInfoSection', () => ({
  PlanBillingPeriodInfoSection: () => <div data-test="plan-billing-period-info-section" />,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeModelSelector', () => ({
  ChargeModelSelector: () => <div data-test="charge-model-selector" />,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeWrapperSwitch', () => ({
  ChargeWrapperSwitch: () => <div data-test="charge-wrapper-switch" />,
}))

jest.mock('~/components/plans/chargeAccordion/CustomPricingUnitSelector', () => ({
  CustomPricingUnitSelector: () => <div data-test="custom-pricing-unit-selector" />,
}))

jest.mock('~/components/plans/chargeAccordion/ChargeFilter', () => ({
  ChargeFilter: () => <div data-test="charge-filter" />,
  buildChargeFilterAddFilterButtonId: jest.fn(() => 'filter-btn-id'),
}))

jest.mock('~/components/plans/chargeAccordion/options/ChargePayInAdvanceOption', () => ({
  ChargePayInAdvanceOption: () => <div data-test="charge-pay-in-advance-option" />,
}))

jest.mock('~/components/plans/chargeAccordion/options/ChargeInvoicingStrategyOption', () => ({
  ChargeInvoicingStrategyOption: () => <div data-test="charge-invoicing-strategy-option" />,
}))

jest.mock('~/components/plans/chargeAccordion/SpendingMinimumOptionSection', () => ({
  SpendingMinimumOptionSection: () => <div data-test="spending-minimum-option-section" />,
}))

jest.mock('~/components/taxes/TaxesSelectorSection', () => ({
  TaxesSelectorSection: () => <div data-test="taxes-selector-section" />,
}))

jest.mock('~/components/plans/utils', () => ({
  mapChargeIntervalCopy: jest.fn(() => ({})),
}))

jest.mock('~/components/ConditionalWrapper', () => ({
  ConditionalWrapper: ({
    children,
  }: {
    children: React.ReactNode
    condition: boolean
    validWrapper: (c: React.ReactNode) => React.ReactNode
    invalidWrapper: (c: React.ReactNode) => React.ReactNode
  }) => <>{children}</>,
}))

// Mock TanStack form infrastructure
const mockHandleSubmit = jest.fn()
const mockReset = jest.fn()
const mockSetFieldValue = jest.fn()
const mockGetFieldValue = jest.fn()
const mockHandleChange = jest.fn()
const mockHandleBlur = jest.fn()

jest.mock('~/hooks/forms/formContext', () => ({
  useFieldContext: jest.fn(),
}))

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((store, selector) => {
    if (typeof store?.getState === 'function') {
      return selector(store.getState())
    }

    return false
  }),
  revalidateLogic: jest.fn(() => ({})),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: jest.fn(
    ({
      onSubmit,
      defaultValues,
    }: {
      onSubmit?: (args: { value: Record<string, unknown> }) => void
      defaultValues: Record<string, unknown>
    }) => {
      capturedOnSubmit = onSubmit
      capturedDefaultValues = defaultValues

      const store = {
        subscribe: jest.fn(() => jest.fn()),
        getState: jest.fn(() => ({ isDirty: false, values: defaultValues })),
      }

      return {
        store,
        state: { values: defaultValues },
        reset: mockReset,
        handleSubmit: () => {
          mockHandleSubmit()
          onSubmit?.({ value: defaultValues })
        },
        setFieldValue: mockSetFieldValue,
        getFieldValue: mockGetFieldValue,
        AppField: ({
          children,
          name,
        }: {
          children: (field: ReturnType<typeof createFieldCtx>) => React.ReactNode
          name: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listeners?: any
        }) => {
          const fieldCtx = createFieldCtx(name, defaultValues[name] ?? '')

          return <>{children(fieldCtx)}</>
        },
        Subscribe: ({
          children,
          selector,
        }: {
          children: (value: unknown) => React.ReactNode
          selector: (state: { canSubmit: boolean }) => unknown
        }) => {
          const value = selector({ canSubmit: true })

          return <>{children(value)}</>
        },
      }
    },
  ),
}))

const MockFieldComponent = (props: Record<string, unknown>) => (
  <input name={props.name as string} disabled={props.disabled as boolean | undefined} />
)

const createFieldCtx = (name: string, value: unknown) => ({
  name,
  state: { value },
  store: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      meta: { errors: [], errorMap: {} },
      values: { [name]: value },
    })),
  },
  handleChange: mockHandleChange,
  handleBlur: mockHandleBlur,
  AmountInputField: (props: Record<string, unknown>) => (
    <MockFieldComponent {...props} name={name} />
  ),
  TextInputField: (props: Record<string, unknown>) => <MockFieldComponent {...props} name={name} />,
  ComboBoxField: (props: Record<string, unknown>) => <MockFieldComponent {...props} name={name} />,
  SwitchField: (props: Record<string, unknown>) => <MockFieldComponent {...props} name={name} />,
  RadioGroupField: (props: Record<string, unknown>) => (
    <MockFieldComponent {...props} name={name} />
  ),
  ButtonSelectorField: (props: Record<string, unknown>) => (
    <MockFieldComponent {...props} name={name} />
  ),
})

const mockedUseFieldContext = useFieldContext as jest.Mock

describe('UsageChargeDrawer', () => {
  const mockOnSave = jest.fn()
  let drawerRef: React.RefObject<UsageChargeDrawerRef>

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = undefined
    capturedDefaultValues = undefined
    drawerRef = createRef<UsageChargeDrawerRef>()
    mockedUseFieldContext.mockReturnValue(createFieldCtx('testField', ''))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the drawer is rendered', () => {
    describe('WHEN it mounts', () => {
      it('THEN should expose ref methods', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(drawerRef.current).toBeDefined()
        expect(typeof drawerRef.current?.openDrawer).toBe('function')
        expect(typeof drawerRef.current?.closeDrawer).toBe('function')
      })
    })
  })

  describe('GIVEN the form default values', () => {
    describe('WHEN the form is initialized', () => {
      it('THEN should have standard as the default charge model', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues).toBeDefined()
        expect(capturedDefaultValues?.chargeModel).toBe('standard')
      })

      it('THEN should have empty billableMetricId', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.billableMetricId).toBe('')
      })

      it('THEN should have invoiceable as true by default', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.invoiceable).toBe(true)
      })

      it('THEN should have payInAdvance as false', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.payInAdvance).toBe(false)
      })

      it('THEN should have empty filters array', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.filters).toEqual([])
      })

      it('THEN should have regroupPaidFees as null', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.regroupPaidFees).toBeNull()
      })

      it('THEN should have empty taxes array', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.taxes).toEqual([])
      })
    })
  })

  describe('GIVEN openDrawer is called with a charge (edit mode)', () => {
    const mockBillableMetric = {
      id: 'bm-1',
      name: 'API Calls',
      code: 'api_calls',
      aggregationType: 'count_agg',
      recurring: false,
    }

    const mockCharge = {
      billableMetric: mockBillableMetric,
      chargeModel: 'percentage' as const,
      id: 'charge-1',
      invoiceDisplayName: 'API Usage',
      invoiceable: false,
      minAmountCents: '500',
      payInAdvance: true,
      prorated: true,
      properties: { rate: '2.5' },
      filters: [{ values: ['val1'], properties: { rate: '3' }, invoiceDisplayName: '' }],
      regroupPaidFees: 'invoice',
      taxes: [{ id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 }],
    }

    describe('WHEN the charge data is provided', () => {
      it('THEN should reset the form with the charge values', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer(
          mockCharge as unknown as Parameters<UsageChargeDrawerRef['openDrawer']>[0],
          0,
        )

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            billableMetricId: 'bm-1',
            chargeModel: 'percentage',
            id: 'charge-1',
            invoiceDisplayName: 'API Usage',
            invoiceable: false,
            minAmountCents: '500',
            payInAdvance: true,
            prorated: true,
            regroupPaidFees: 'invoice',
          }),
          { keepDefaultValues: true },
        )
      })

      it('THEN should map the billableMetric correctly', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer(
          mockCharge as unknown as Parameters<UsageChargeDrawerRef['openDrawer']>[0],
          0,
        )

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            billableMetric: mockBillableMetric,
          }),
          expect.anything(),
        )
      })

      it('THEN should include filters and taxes', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer(
          mockCharge as unknown as Parameters<UsageChargeDrawerRef['openDrawer']>[0],
          0,
        )

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            filters: mockCharge.filters,
            taxes: [{ id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 }],
          }),
          expect.anything(),
        )
      })
    })
  })

  describe('GIVEN openDrawer is called without a charge (create mode)', () => {
    describe('WHEN no charge data is provided', () => {
      it('THEN should reset the form with default values', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer()

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            billableMetricId: '',
            chargeModel: 'standard',
            invoiceable: true,
            payInAdvance: false,
            prorated: false,
            filters: [],
            regroupPaidFees: null,
            taxes: [],
          }),
          { keepDefaultValues: true },
        )
      })
    })
  })

  describe('GIVEN the onSubmit handler', () => {
    describe('WHEN the form is submitted with valid data', () => {
      it('THEN should call onSave with the form values', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        const formValues: UsageChargeDrawerFormValues = {
          billableMetricId: 'bm-1',
          billableMetric: {
            id: 'bm-1',
            name: 'Calls',
            code: 'calls',
            aggregationType:
              'count_agg' as UsageChargeDrawerFormValues['billableMetric']['aggregationType'],
            recurring: false,
          },
          chargeModel: 'standard' as UsageChargeDrawerFormValues['chargeModel'],
          invoiceDisplayName: 'Test',
          invoiceable: true,
          minAmountCents: '100',
          payInAdvance: false,
          prorated: false,
          properties: { amount: '10' },
          filters: [],
          regroupPaidFees: null,
          taxes: [],
        }

        capturedOnSubmit?.({ value: formValues as unknown as Record<string, unknown> })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            chargeModel: 'standard',
            invoiceable: true,
            payInAdvance: false,
          }),
          -1,
        )
      })
    })

    describe('WHEN invoiceDisplayName is empty string', () => {
      it('THEN should normalize to undefined', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({
          value: {
            ...capturedDefaultValues,
            billableMetric: {
              id: '',
              name: '',
              code: '',
              aggregationType: 'count_agg',
              recurring: false,
            },
            invoiceDisplayName: '',
          },
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ invoiceDisplayName: undefined }),
          -1,
        )
      })
    })

    describe('WHEN minAmountCents is empty string', () => {
      it('THEN should normalize to undefined', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({
          value: {
            ...capturedDefaultValues,
            billableMetric: {
              id: '',
              name: '',
              code: '',
              aggregationType: 'count_agg',
              recurring: false,
            },
            minAmountCents: '',
          },
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ minAmountCents: undefined }),
          -1,
        )
      })
    })

    describe('WHEN regroupPaidFees is empty string', () => {
      it('THEN should normalize to undefined', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({
          value: {
            ...capturedDefaultValues,
            billableMetric: {
              id: '',
              name: '',
              code: '',
              aggregationType: 'count_agg',
              recurring: false,
            },
            regroupPaidFees: '',
          },
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ regroupPaidFees: undefined }),
          -1,
        )
      })
    })
  })

  describe('GIVEN openDrawer with missing optional fields', () => {
    describe('WHEN optional charge fields are undefined', () => {
      it('THEN should use default fallback values', () => {
        render(<UsageChargeDrawer ref={drawerRef} onSave={mockOnSave} />)

        const minimalCharge = {
          billableMetric: {
            id: 'bm-1',
            name: 'Metric',
            code: 'metric',
            aggregationType: 'count_agg',
            recurring: false,
          },
          chargeModel: 'standard' as const,
        }

        drawerRef.current?.openDrawer(
          minimalCharge as unknown as Parameters<UsageChargeDrawerRef['openDrawer']>[0],
          0,
        )

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({
            invoiceDisplayName: '',
            invoiceable: true,
            minAmountCents: '',
            payInAdvance: false,
            prorated: false,
            filters: [],
            regroupPaidFees: null,
            taxes: [],
          }),
          { keepDefaultValues: true },
        )
      })
    })
  })
})
