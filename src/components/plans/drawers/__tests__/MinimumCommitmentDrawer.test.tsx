import { useStore } from '@tanstack/react-form'
import { act, render } from '@testing-library/react'
import { createRef } from 'react'

import { useFieldContext } from '~/hooks/forms/formContext'

import {
  MinimumCommitmentDrawer,
  MinimumCommitmentDrawerRef,
  MinimumCommitmentFormValues,
} from '../MinimumCommitmentDrawer'

// --- Mocks ---

let capturedOnEntered: (() => void) | undefined
let capturedOnClose: (() => void) | undefined
let capturedShowCloseWarningDialog: boolean | undefined
let capturedOnSubmit: ((args: { value: Record<string, unknown> }) => void) | undefined
let capturedDefaultValues: Record<string, unknown> | undefined
let capturedTaxOnUpdate: ((taxes: unknown[]) => void) | undefined
const mockDrawerCloseDrawer = jest.fn()

jest.mock('~/components/designSystem/Drawer', () => {
  const React = jest.requireActual('react')

  const MockDrawer = React.forwardRef(
    (
      {
        children,
        onEntered,
        onClose,
        showCloseWarningDialog,
      }: {
        children: unknown
        onEntered?: () => void
        onClose?: () => void
        showCloseWarningDialog?: boolean
      },
      ref: unknown,
    ) => {
      capturedOnEntered = onEntered
      capturedOnClose = onClose
      capturedShowCloseWarningDialog = showCloseWarningDialog

      React.useImperativeHandle(ref, () => ({
        openDrawer: jest.fn(),
        closeDrawer: mockDrawerCloseDrawer,
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

jest.mock('~/core/formats/intlFormatNumber', () => ({
  getCurrencySymbol: (currency: string) => currency,
  intlFormatNumber: jest.fn(),
}))

jest.mock('~/components/taxes/TaxesSelectorSection', () => ({
  TaxesSelectorSection: ({ onUpdate }: { onUpdate?: (taxes: unknown[]) => void }) => {
    capturedTaxOnUpdate = onUpdate

    return <div data-test="taxes-selector-section" />
  },
}))

jest.mock('~/components/plans/drawers/PlanBillingPeriodInfoSection', () => ({
  PlanBillingPeriodInfoSection: () => <div data-test="plan-billing-period-info-section" />,
}))

jest.mock('~/contexts/PlanFormContext', () => {
  const { CurrencyEnum: CE, PlanInterval: PI } = jest.requireActual('~/generated/graphql')

  return {
    usePlanFormContext: () => ({
      currency: CE.Usd,
      interval: PI.Monthly,
    }),
  }
})

// Mock TanStack form infrastructure
const mockHandleSubmit = jest.fn()
const mockReset = jest.fn()
const mockHandleChange = jest.fn()
const mockHandleBlur = jest.fn()
const mockSetFieldValue = jest.fn()

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
        getState: jest.fn(() => ({ isDirty: false })),
      }

      return {
        store,
        state: { values: defaultValues },
        reset: mockReset,
        setFieldValue: mockSetFieldValue,
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
          selector: (state: { canSubmit: boolean; values: Record<string, unknown> }) => unknown
        }) => {
          const value = selector({ canSubmit: true, values: defaultValues })

          return <>{children(value)}</>
        },
      }
    },
  ),
}))

const MockFieldComponent = (props: Record<string, unknown>) => {
  const inputRef = (props.InputProps as { inputRef?: unknown })?.inputRef

  return (
    <input
      name={props.name as string}
      disabled={props.disabled as boolean | undefined}
      ref={inputRef as React.Ref<HTMLInputElement>}
    />
  )
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
})

const mockedUseFieldContext = useFieldContext as jest.Mock

describe('MinimumCommitmentDrawer', () => {
  const mockOnSave = jest.fn()
  let drawerRef: React.RefObject<MinimumCommitmentDrawerRef>

  const defaultFormValues: MinimumCommitmentFormValues = {
    amountCents: '500',
    invoiceDisplayName: 'Test Commitment',
    taxes: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = undefined
    capturedDefaultValues = undefined
    capturedOnClose = undefined
    capturedShowCloseWarningDialog = undefined
    capturedTaxOnUpdate = undefined
    drawerRef = createRef<MinimumCommitmentDrawerRef>()
    mockedUseFieldContext.mockReturnValue(createFieldCtx('testField', ''))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the drawer is rendered', () => {
    describe('WHEN it is initially closed', () => {
      it('THEN should expose ref methods', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(drawerRef.current).toBeDefined()
        expect(drawerRef.current?.openDrawer).toBeDefined()
        expect(drawerRef.current?.closeDrawer).toBeDefined()
      })
    })
  })

  describe('GIVEN the drawer ref is exposed', () => {
    describe('WHEN the component mounts', () => {
      it('THEN should expose openDrawer and closeDrawer as functions', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(typeof drawerRef.current?.openDrawer).toBe('function')
        expect(typeof drawerRef.current?.closeDrawer).toBe('function')
      })
    })

    describe('WHEN openDrawer is called with values', () => {
      it('THEN should reset the form with keepDefaultValues true', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        drawerRef.current?.openDrawer(defaultFormValues)

        expect(mockReset).toHaveBeenCalledWith(defaultFormValues, { keepDefaultValues: true })
      })
    })
  })

  describe('GIVEN the form default values', () => {
    describe('WHEN the form is initialized', () => {
      it('THEN amountCents defaults to empty string', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues).toBeDefined()
        expect(capturedDefaultValues?.amountCents).toBe('')
      })

      it('THEN taxes defaults to empty array', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedDefaultValues?.taxes).toEqual([])
      })
    })
  })

  describe('GIVEN the onSubmit handler', () => {
    describe('WHEN values are submitted', () => {
      it('THEN should call onSave with correct values', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({ value: { ...defaultFormValues } })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            amountCents: '500',
            invoiceDisplayName: 'Test Commitment',
            taxes: [],
          }),
        )
      })
    })

    describe('WHEN invoiceDisplayName is empty string', () => {
      it('THEN should normalize to undefined', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({ value: { ...defaultFormValues, invoiceDisplayName: '' } })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ invoiceDisplayName: undefined }),
        )
      })
    })
  })

  describe('GIVEN the drawer renders its sub-components', () => {
    it('THEN should render the PlanBillingPeriodInfoSection', () => {
      const { container } = render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

      expect(container.querySelector('[data-test="plan-billing-period-info-section"]')).toBeTruthy()
    })

    it('THEN should render the TaxesSelectorSection', () => {
      const { container } = render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

      expect(container.querySelector('[data-test="taxes-selector-section"]')).toBeTruthy()
    })
  })

  describe('GIVEN the drawer has an onEntered callback', () => {
    describe('WHEN onEntered is triggered after the slide transition', () => {
      it('THEN should focus the amountCents input', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

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

  describe('GIVEN the drawer close behavior', () => {
    describe('WHEN onClose is triggered', () => {
      it('THEN should reset the form without arguments', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnClose?.()

        expect(mockReset).toHaveBeenCalledWith()
      })
    })

    describe('WHEN the form is dirty', () => {
      it('THEN should pass showCloseWarningDialog as true to the drawer', () => {
        ;(useStore as jest.Mock).mockImplementationOnce(() => true)

        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedShowCloseWarningDialog).toBe(true)
      })
    })

    describe('WHEN the form is not dirty', () => {
      it('THEN should pass showCloseWarningDialog as false to the drawer', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        expect(capturedShowCloseWarningDialog).toBe(false)
      })
    })
  })

  describe('GIVEN the form submission flow', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should close the drawer after saving', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        capturedOnSubmit?.({ value: { ...defaultFormValues } })

        expect(mockOnSave).toHaveBeenCalled()
        expect(mockDrawerCloseDrawer).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the tax management', () => {
    describe('WHEN taxes are updated via the selector', () => {
      it('THEN should update the form taxes field', () => {
        render(<MinimumCommitmentDrawer ref={drawerRef} onSave={mockOnSave} />)

        const newTaxes = [{ id: 'tax-1', code: 'vat', name: 'VAT', rate: 20 }]

        capturedTaxOnUpdate?.(newTaxes)

        expect(mockSetFieldValue).toHaveBeenCalledWith('taxes', newTaxes)
      })
    })
  })
})
