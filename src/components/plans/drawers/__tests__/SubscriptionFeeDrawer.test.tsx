import { act, render } from '@testing-library/react'
import { createRef } from 'react'

import { PlanInterval } from '~/generated/graphql'
import { useFieldContext } from '~/hooks/forms/formContext'

import {
  SubscriptionFeeDrawer,
  SubscriptionFeeDrawerRef,
  SubscriptionFeeFormValues,
} from '../SubscriptionFeeDrawer'

// --- Mocks ---

// Capture onEntered callback passed to the Drawer
let capturedOnEntered: (() => void) | undefined

jest.mock('~/components/designSystem/Drawer', () => {
  const React = jest.requireActual('react')

  const MockDrawer = React.forwardRef(
    ({ children, onEntered }: { children: unknown; onEntered?: () => void }, ref: unknown) => {
      capturedOnEntered = onEntered

      React.useImperativeHandle(ref, () => ({
        openDrawer: jest.fn(),
        closeDrawer: jest.fn(),
      }))

      return (
        <div data-test="mocked-drawer">
          {typeof children === 'function' ? children({ closeDrawer: jest.fn() }) : children}
        </div>
      )
    },
  )

  MockDrawer.displayName = 'Drawer'

  return { Drawer: MockDrawer }
})

const mockTranslate = jest.fn((key: string) => `translated_${key}`)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
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

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (currency: string) => currency,
  intlFormatNumber: jest.fn(),
}))

jest.mock('~/components/plans/drawers/PlanBillingPeriodInfoSection', () => ({
  PlanBillingPeriodInfoSection: () => <div data-test="plan-billing-period-info-section" />,
}))

// Mock TanStack form infrastructure
const mockHandleSubmit = jest.fn()
const mockReset = jest.fn()
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
      onSubmit?: (args: { value: unknown }) => void
      defaultValues: Record<string, unknown>
    }) => {
      const store = {
        subscribe: jest.fn(() => jest.fn()),
        getState: jest.fn(() => ({ isDirty: false })),
      }

      return {
        store,
        state: { values: defaultValues },
        reset: mockReset,
        handleSubmit: () => {
          mockHandleSubmit()
          onSubmit?.({ value: defaultValues })
        },
        AppField: ({
          children,
          name,
        }: {
          children: (field: ReturnType<typeof createFieldCtx>) => React.ReactNode
          name: string
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

const MockFieldComponent = (props: Record<string, unknown>) => {
  const inputRef = (props.InputProps as { inputRef?: unknown })?.inputRef

  return <input name={props.name as string} ref={inputRef as React.Ref<HTMLInputElement>} />
}

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
  RadioGroupField: (props: Record<string, unknown>) => (
    <MockFieldComponent {...props} name={name} />
  ),
})

const mockedUseFieldContext = useFieldContext as jest.Mock

describe('SubscriptionFeeDrawer', () => {
  const mockOnSave = jest.fn()
  let drawerRef: React.RefObject<SubscriptionFeeDrawerRef>

  const defaultFormValues: SubscriptionFeeFormValues = {
    amountCents: '100',
    interval: PlanInterval.Monthly,
    payInAdvance: false,
    trialPeriod: '30',
    invoiceDisplayName: 'Test Fee',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    drawerRef = createRef<SubscriptionFeeDrawerRef>()
    mockedUseFieldContext.mockReturnValue(createFieldCtx('testField', ''))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the drawer is rendered', () => {
    describe('WHEN it is initially closed', () => {
      it('THEN should expose ref methods', () => {
        render(<SubscriptionFeeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(drawerRef.current).toBeDefined()
        expect(drawerRef.current?.openDrawer).toBeDefined()
        expect(drawerRef.current?.closeDrawer).toBeDefined()
      })
    })
  })

  describe('GIVEN the drawer ref is exposed', () => {
    describe('WHEN the component mounts', () => {
      it('THEN should expose openDrawer and closeDrawer as functions', () => {
        render(<SubscriptionFeeDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(typeof drawerRef.current?.openDrawer).toBe('function')
        expect(typeof drawerRef.current?.closeDrawer).toBe('function')
      })
    })

    describe('WHEN openDrawer is called with values', () => {
      it('THEN should reset the form with keepDefaultValues true', () => {
        render(<SubscriptionFeeDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer(defaultFormValues)

        expect(mockReset).toHaveBeenCalledWith(defaultFormValues, { keepDefaultValues: true })
      })
    })
  })

  describe('GIVEN the form values type', () => {
    describe('WHEN SubscriptionFeeFormValues is constructed', () => {
      it('THEN should contain all required fields', () => {
        const values: SubscriptionFeeFormValues = {
          amountCents: '50',
          interval: PlanInterval.Yearly,
          payInAdvance: true,
          trialPeriod: '14',
          invoiceDisplayName: 'Custom Name',
        }

        expect(values.amountCents).toBe('50')
        expect(values.interval).toBe(PlanInterval.Yearly)
        expect(values.payInAdvance).toBe(true)
        expect(values.trialPeriod).toBe('14')
        expect(values.invoiceDisplayName).toBe('Custom Name')
      })
    })
  })

  describe('GIVEN the drawer has an onEntered callback', () => {
    describe('WHEN onEntered is triggered after the slide transition', () => {
      it('THEN should focus the amountCents input', () => {
        render(<SubscriptionFeeDrawer ref={drawerRef} onSave={mockOnSave} />)

        const amountInput = document.querySelector('input[name="amountCents"]') as HTMLInputElement

        expect(amountInput).toBeTruthy()
        expect(document.activeElement).not.toBe(amountInput)

        act(() => {
          capturedOnEntered?.()
        })

        expect(document.activeElement).toBe(amountInput)
      })
    })
  })
})
