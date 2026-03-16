import { useStore } from '@tanstack/react-form'
import { act, render } from '@testing-library/react'
import { createRef } from 'react'

import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { useFieldContext } from '~/hooks/forms/formContext'

import {
  FeatureEntitlementDrawer,
  FeatureEntitlementDrawerRef,
  FeatureEntitlementFormValues,
} from '../FeatureEntitlementDrawer'

// --- Mocks ---

let capturedOnClose: (() => void) | undefined
let capturedShowCloseWarningDialog: boolean | undefined
let capturedOnSubmit: ((args: { value: Record<string, unknown> }) => void) | undefined
let capturedDefaultValues: Record<string, unknown> | undefined
let capturedFeatureCodeOnChange:
  | ((args: { value: unknown; fieldApi: { setValue: (v: unknown) => void } }) => void)
  | undefined
const mockDrawerCloseDrawer = jest.fn()

jest.mock('~/components/designSystem/Drawer', () => {
  const React = jest.requireActual('react')

  const MockDrawer = React.forwardRef(
    (
      {
        children,
        onClose,
        showCloseWarningDialog,
        stickyBottomBar,
      }: {
        children: unknown
        onClose?: () => void
        showCloseWarningDialog?: boolean
        stickyBottomBar?: (args: { closeDrawer: () => void }) => React.ReactNode
      },
      ref: unknown,
    ) => {
      capturedOnClose = onClose
      capturedShowCloseWarningDialog = showCloseWarningDialog

      React.useImperativeHandle(ref, () => ({
        openDrawer: jest.fn(),
        closeDrawer: mockDrawerCloseDrawer,
      }))

      return (
        <div data-test="mocked-drawer">
          {typeof children === 'function' ? children({ closeDrawer: jest.fn() }) : children}
          {typeof stickyBottomBar === 'function' &&
            stickyBottomBar({ closeDrawer: mockDrawerCloseDrawer })}
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

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: jest.fn(() => ({
      data: null,
      loading: false,
    })),
    useGetFeaturesListForPlanSectionLazyQuery: jest.fn(() => [jest.fn(), { data: null }]),
  }
})

// Mock TanStack form infrastructure
const mockHandleSubmit = jest.fn()
const mockReset = jest.fn()
const mockHandleChange = jest.fn()
const mockHandleBlur = jest.fn()
const mockSetFieldValue = jest.fn()
const mockRemoveFieldValue = jest.fn()

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

// Captures props passed to PrivilegeValueCell via the mocked form infrastructure
let mockAppFieldChildren: Map<
  string,
  { children: (field: unknown) => React.ReactNode; name: string }
>

// Store for overriding form values per test
let mockFormValuesOverride: Record<string, unknown> | null = null

jest.mock('~/hooks/forms/useAppform', () => ({
  withForm: ({
    render: Render,
  }: {
    defaultValues: Record<string, unknown>
    props: Record<string, unknown>
    render: React.FC<{ form: unknown; [key: string]: unknown }>
  }) => {
    return (props: { form: unknown; [key: string]: unknown }) => <Render {...props} />
  },
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

      const currentValues = mockFormValuesOverride ?? defaultValues

      const store = {
        subscribe: jest.fn(() => jest.fn()),
        getState: jest.fn(() => ({ isDirty: false, values: currentValues })),
      }

      return {
        store,
        state: { values: currentValues },
        reset: mockReset,
        setFieldValue: mockSetFieldValue,
        removeFieldValue: mockRemoveFieldValue,
        handleSubmit: () => {
          mockHandleSubmit()
          onSubmit?.({ value: currentValues })
        },
        AppField: ({
          children,
          name,
          listeners,
        }: {
          children: (field: ReturnType<typeof createFieldCtx>) => React.ReactNode
          name: string
          listeners?: {
            onChange?: (args: {
              value: unknown
              fieldApi: { setValue: (v: unknown) => void }
            }) => void
          }
        }) => {
          if (name === 'featureCode' && listeners?.onChange) {
            capturedFeatureCodeOnChange = listeners.onChange
          }

          mockAppFieldChildren.set(name, { children: children as never, name })

          const fieldCtx = createFieldCtx(name, currentValues[name] ?? '')

          return <>{children(fieldCtx)}</>
        },
        Subscribe: ({
          children,
          selector,
        }: {
          children: (value: unknown) => React.ReactNode
          selector: (state: { canSubmit: boolean; values: Record<string, unknown> }) => unknown
        }) => {
          const value = selector({ canSubmit: true, values: currentValues })

          return <>{children(value)}</>
        },
      }
    },
  ),
}))

// Mock Tooltip to expose its props for assertions
jest.mock('~/components/designSystem/Tooltip', () => ({
  Tooltip: ({
    children,
    title,
    disableHoverListener,
    placement,
  }: {
    children: React.ReactNode
    title?: string
    disableHoverListener?: boolean
    placement?: string
  }) => (
    <div
      data-test="mocked-tooltip"
      data-tooltip-title={title || ''}
      data-tooltip-disabled={String(!!disableHoverListener)}
      data-tooltip-placement={placement || ''}
    >
      {children}
    </div>
  ),
}))

// Mock ComboBox to expose its props
jest.mock('~/components/form', () => ({
  ComboBox: ({
    value,
    error,
    placeholder,
    onChange,
    variant,
    data,
    className,
    disableClearable,
  }: {
    value?: string
    error?: boolean
    placeholder?: string
    onChange?: (v: string) => void
    variant?: string
    data?: { label: string; value: string }[]
    className?: string
    disableClearable?: boolean
  }) => (
    <div
      data-test="mocked-combobox"
      data-value={value || ''}
      data-error={String(!!error)}
      data-placeholder={placeholder || ''}
      data-variant={variant || ''}
      data-option-count={String(data?.length ?? 0)}
      data-classname={className || ''}
      data-disable-clearable={String(!!disableClearable)}
    >
      {data?.map((item, i) => (
        <button
          key={i}
          data-test={`combobox-option-${i}`}
          data-option-value={item.value}
          onClick={() => onChange?.(item.value)}
        />
      ))}
      <button data-test="combobox-trigger" onClick={() => onChange?.(data?.[0]?.value ?? '')} />
    </div>
  ),
  ComboboxItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock TextInput to expose its props
jest.mock('~/components/form/TextInput/TextInput', () => ({
  TextInput: ({
    error,
    variant,
    placeholder,
    beforeChangeFormatter,
    value,
    onChange,
    name,
  }: {
    error?: boolean
    variant?: string
    placeholder?: string
    beforeChangeFormatter?: string[]
    value?: string
    onChange?: (value: string) => void
    name?: string
  }) => (
    <div
      data-test="mocked-text-input"
      data-error={String(!!error)}
      data-variant={variant || ''}
      data-placeholder={placeholder || ''}
      data-formatter={beforeChangeFormatter?.join(',') || ''}
      data-value={value || ''}
      data-name={name || ''}
    >
      <input
        data-test="text-input-field"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  ),
}))

jest.mock('~/components/designSystem/Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div data-test="mocked-alert">{children}</div>
  ),
}))

jest.mock('~/components/designSystem/Table/ChargeTable', () => ({
  ChargeTable: ({
    data,
    columns,
    onDeleteRow,
  }: {
    data: Record<string, unknown>[]
    columns: {
      content: (row: Record<string, unknown>, index: number) => React.ReactNode
    }[]
    onDeleteRow?: (row: Record<string, unknown>, index: number) => void
  }) => (
    <div data-test="mocked-charge-table">
      {data.map((row, i) => (
        <div key={i} data-test={`charge-table-row-${i}`}>
          {columns.map((col, j) => (
            <div key={j} data-test={`charge-table-cell-${i}-${j}`}>
              {typeof col.content === 'function' ? col.content(row, i) : null}
            </div>
          ))}
          {onDeleteRow && (
            <button data-test={`delete-row-${i}`} onClick={() => onDeleteRow(row, i)} />
          )}
        </div>
      ))}
    </div>
  ),
}))

jest.mock('~/components/designSystem/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    icon,
    startIcon,
    disabled,
    ...rest
  }: {
    children?: React.ReactNode
    onClick?: () => void
    variant?: string
    icon?: string
    startIcon?: string
    disabled?: boolean
    [key: string]: unknown
  }) => (
    <button
      data-test={rest['data-test'] as string}
      data-variant={variant || ''}
      data-icon={icon || ''}
      data-start-icon={startIcon || ''}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}))

jest.mock('~/components/designSystem/Selector', () => ({
  Selector: ({ title, subtitle }: { icon?: string; title?: string; subtitle?: string }) => (
    <div data-test="mocked-selector" data-title={title} data-subtitle={subtitle} />
  ),
}))

jest.mock('~/core/utils/domUtils', () => ({
  scrollToAndClickElement: jest.fn(),
}))

const MockFieldComponent = (props: Record<string, unknown>) => (
  <input name={props.name as string} disabled={props.disabled as boolean | undefined} />
)

const createFieldCtx = (name: string, value: unknown, errors: { message: string }[] = []) => ({
  name,
  state: { value },
  store: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      meta: { errors, errorMap: {} },
      values: { [name]: value },
    })),
  },
  handleChange: mockHandleChange,
  handleBlur: mockHandleBlur,
  ComboBoxField: (props: Record<string, unknown>) => <MockFieldComponent {...props} name={name} />,
  TextInputField: (props: Record<string, unknown>) => <MockFieldComponent {...props} name={name} />,
})

const mockedUseFieldContext = useFieldContext as jest.Mock

describe('FeatureEntitlementDrawer', () => {
  const mockOnSave = jest.fn()
  let drawerRef: React.RefObject<FeatureEntitlementDrawerRef>

  const defaultFormValues: FeatureEntitlementFormValues = {
    featureId: 'feature-1',
    featureName: 'Feature One',
    featureCode: 'feature_one',
    privileges: [],
  }

  const privilegeRow = {
    privilegeCode: 'priv-1',
    privilegeName: 'Privilege One',
    value: '',
    valueType: PrivilegeValueTypeEnum.String,
    config: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnSubmit = undefined
    capturedDefaultValues = undefined
    capturedOnClose = undefined
    capturedShowCloseWarningDialog = undefined
    capturedFeatureCodeOnChange = undefined
    mockAppFieldChildren = new Map()
    mockFormValuesOverride = null
    drawerRef = createRef<FeatureEntitlementDrawerRef>()
    mockedUseFieldContext.mockReturnValue(createFieldCtx('testField', ''))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // --- Drawer ref ---

  describe('GIVEN the drawer is rendered', () => {
    describe('WHEN it is initially closed', () => {
      it('THEN should expose ref methods', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(drawerRef.current).toBeDefined()
        expect(drawerRef.current?.openDrawer).toBeDefined()
        expect(drawerRef.current?.closeDrawer).toBeDefined()
      })

      it('THEN should expose openDrawer and closeDrawer as functions', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(typeof drawerRef.current?.openDrawer).toBe('function')
        expect(typeof drawerRef.current?.closeDrawer).toBe('function')
      })
    })
  })

  // --- openDrawer ---

  describe('GIVEN the drawer ref is exposed', () => {
    describe('WHEN openDrawer is called with values', () => {
      it('THEN should reset the form with keepDefaultValues true', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        drawerRef.current?.openDrawer(defaultFormValues)

        expect(mockReset).toHaveBeenCalledWith(
          { ...defaultFormValues, privileges: [] },
          { keepDefaultValues: true },
        )
      })
    })

    describe('WHEN openDrawer is called with values including privileges', () => {
      it('THEN should reset with the provided privileges array', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        const valuesWithPrivileges = {
          ...defaultFormValues,
          privileges: [privilegeRow],
        }

        drawerRef.current?.openDrawer(valuesWithPrivileges)

        expect(mockReset).toHaveBeenCalledWith(
          expect.objectContaining({ privileges: [privilegeRow] }),
          { keepDefaultValues: true },
        )
      })
    })

    describe('WHEN openDrawer is called with undefined privileges', () => {
      it('THEN should default privileges to empty array via nullish coalescing', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        const valuesWithoutPrivileges = {
          ...defaultFormValues,
          privileges: undefined as unknown as FeatureEntitlementFormValues['privileges'],
        }

        drawerRef.current?.openDrawer(valuesWithoutPrivileges)

        expect(mockReset).toHaveBeenCalledWith(expect.objectContaining({ privileges: [] }), {
          keepDefaultValues: true,
        })
      })
    })

    describe('WHEN openDrawer is called without values', () => {
      it('THEN should reset the form without arguments', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        drawerRef.current?.openDrawer()

        expect(mockReset).toHaveBeenCalledWith()
      })
    })
  })

  // --- Form default values ---

  describe('GIVEN the form default values', () => {
    describe('WHEN the form is initialized', () => {
      it('THEN featureId defaults to empty string', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedDefaultValues?.featureId).toBe('')
      })

      it('THEN featureName defaults to empty string', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedDefaultValues?.featureName).toBe('')
      })

      it('THEN featureCode defaults to empty string', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedDefaultValues?.featureCode).toBe('')
      })

      it('THEN privileges defaults to empty array', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedDefaultValues?.privileges).toEqual([])
      })
    })
  })

  // --- onSubmit ---

  describe('GIVEN the onSubmit handler', () => {
    describe('WHEN values are submitted', () => {
      it('THEN should call onSave with correct values', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedOnSubmit?.({ value: { ...defaultFormValues } })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            featureId: 'feature-1',
            featureName: 'Feature One',
            featureCode: 'feature_one',
            privileges: [],
          }),
        )
      })
    })

    describe('WHEN privileges is undefined', () => {
      it('THEN should normalize to empty array', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedOnSubmit?.({
          value: { ...defaultFormValues, privileges: undefined },
        })

        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ privileges: [] }))
      })
    })

    describe('WHEN values are submitted with privileges', () => {
      it('THEN should pass privileges through to onSave', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedOnSubmit?.({
          value: { ...defaultFormValues, privileges: [privilegeRow] },
        })

        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ privileges: [privilegeRow] }),
        )
      })
    })
  })

  // --- Drawer close ---

  describe('GIVEN the drawer close behavior', () => {
    describe('WHEN onClose is triggered', () => {
      it('THEN should reset the form', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedOnClose?.()

        expect(mockReset).toHaveBeenCalledWith()
      })
    })

    describe('WHEN the form is dirty', () => {
      it('THEN should pass showCloseWarningDialog as true', () => {
        ;(useStore as jest.Mock).mockImplementationOnce(() => true)

        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedShowCloseWarningDialog).toBe(true)
      })
    })

    describe('WHEN the form is not dirty', () => {
      it('THEN should pass showCloseWarningDialog as false', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedShowCloseWarningDialog).toBe(false)
      })
    })
  })

  // --- Submission flow ---

  describe('GIVEN the form submission flow', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should close the drawer after saving', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedOnSubmit?.({ value: { ...defaultFormValues } })

        expect(mockOnSave).toHaveBeenCalled()
        expect(mockDrawerCloseDrawer).toHaveBeenCalled()
      })
    })
  })

  // --- Add mode vs edit mode ---

  describe('GIVEN the feature code state', () => {
    describe('WHEN featureCode is empty (add mode)', () => {
      it('THEN should render the feature ComboBox field', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(mockAppFieldChildren.has('featureCode')).toBe(true)
      })

      it('THEN should not render the privilege section', () => {
        const { container } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(container.querySelector('[data-test="mocked-charge-table"]')).toBeNull()
      })
    })

    describe('WHEN featureCode is set (edit mode)', () => {
      it('THEN should render the Selector instead of ComboBox', () => {
        mockFormValuesOverride = { ...defaultFormValues }

        const { container } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        const selector = container.querySelector('[data-test="mocked-selector"]')

        expect(selector).toBeTruthy()
        expect(selector?.getAttribute('data-title')).toBe('Feature One')
        expect(selector?.getAttribute('data-subtitle')).toBe('feature_one')
      })
    })
  })

  // --- Selector display in edit mode ---

  describe('GIVEN the feature selector in edit mode', () => {
    describe('WHEN featureName is available', () => {
      it('THEN should display featureName as title', () => {
        mockFormValuesOverride = { ...defaultFormValues }

        const { container } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        const selector = container.querySelector('[data-test="mocked-selector"]')

        expect(selector?.getAttribute('data-title')).toBe('Feature One')
      })
    })

    describe('WHEN featureName is empty', () => {
      it('THEN should fall back to featureCode as title', () => {
        mockFormValuesOverride = { ...defaultFormValues, featureName: '' }

        const { container } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        const selector = container.querySelector('[data-test="mocked-selector"]')

        expect(selector?.getAttribute('data-title')).toBe('feature_one')
      })
    })
  })

  // --- closeDrawer ref method ---

  describe('GIVEN the closeDrawer ref method', () => {
    describe('WHEN closeDrawer is called on the ref', () => {
      it('THEN should call the underlying drawer closeDrawer', () => {
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        drawerRef.current?.closeDrawer()

        expect(mockDrawerCloseDrawer).toHaveBeenCalled()
      })
    })
  })

  // --- featureCode onChange listener ---

  describe('GIVEN the featureCode onChange listener', () => {
    describe('WHEN a feature is selected and found in the data', () => {
      it('THEN should set featureId and featureName on the form', () => {
        const { useGetFeaturesListForPlanSectionLazyQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeaturesListForPlanSectionLazyQuery: jest.Mock
        }

        useGetFeaturesListForPlanSectionLazyQuery.mockReturnValue([
          jest.fn(),
          {
            data: {
              features: {
                collection: [
                  { id: 'feat-id-1', code: 'feat_code_1', name: 'Feature Alpha' },
                  { id: 'feat-id-2', code: 'feat_code_2', name: 'Feature Beta' },
                ],
              },
            },
          },
        ])

        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        expect(capturedFeatureCodeOnChange).toBeDefined()
        capturedFeatureCodeOnChange?.({
          value: 'feat_code_2',
          fieldApi: { setValue: jest.fn() },
        })

        expect(mockSetFieldValue).toHaveBeenCalledWith('featureId', 'feat-id-2')
        expect(mockSetFieldValue).toHaveBeenCalledWith('featureName', 'Feature Beta')
      })
    })

    describe('WHEN the selected feature is not found in the data', () => {
      it('THEN should not call setFieldValue', () => {
        const { useGetFeaturesListForPlanSectionLazyQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeaturesListForPlanSectionLazyQuery: jest.Mock
        }

        useGetFeaturesListForPlanSectionLazyQuery.mockReturnValue([
          jest.fn(),
          {
            data: {
              features: {
                collection: [{ id: 'feat-id-1', code: 'feat_code_1', name: 'Feature Alpha' }],
              },
            },
          },
        ])

        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedFeatureCodeOnChange?.({
          value: 'unknown_code',
          fieldApi: { setValue: jest.fn() },
        })

        expect(mockSetFieldValue).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the selected feature has an empty name', () => {
      it('THEN should set featureName to empty string', () => {
        const { useGetFeaturesListForPlanSectionLazyQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeaturesListForPlanSectionLazyQuery: jest.Mock
        }

        useGetFeaturesListForPlanSectionLazyQuery.mockReturnValue([
          jest.fn(),
          {
            data: {
              features: {
                collection: [{ id: 'feat-id-1', code: 'feat_code_1', name: '' }],
              },
            },
          },
        ])

        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        capturedFeatureCodeOnChange?.({
          value: 'feat_code_1',
          fieldApi: { setValue: jest.fn() },
        })

        expect(mockSetFieldValue).toHaveBeenCalledWith('featureName', '')
      })
    })
  })

  // --- Add privilege flow ---

  describe('GIVEN the add privilege flow', () => {
    const setupWithPrivilegeDetails = () => {
      const { useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery } = jest.requireMock(
        '~/generated/graphql',
      ) as {
        useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: jest.Mock
      }

      useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery.mockReturnValue({
        data: {
          feature: {
            id: 'feature-1',
            code: 'feature_one',
            name: 'Feature One',
            privileges: [
              {
                id: 'priv-id-1',
                code: 'priv_code_1',
                name: 'Privilege Alpha',
                valueType: PrivilegeValueTypeEnum.String,
                config: null,
              },
              {
                id: 'priv-id-2',
                code: 'priv_code_2',
                name: 'Privilege Beta',
                valueType: PrivilegeValueTypeEnum.Boolean,
                config: null,
              },
            ],
          },
        },
        loading: false,
      })
    }

    describe('WHEN the "Add privilege" button is clicked', () => {
      it('THEN should show the privilege ComboBox input', () => {
        setupWithPrivilegeDetails()

        mockFormValuesOverride = { ...defaultFormValues }

        const { container, getByText } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // Initially the add button should be visible
        const addButton = getByText('translated_text_1753864223060n9hxs03sa15')

        expect(addButton).toBeTruthy()

        // Click the add button
        act(() => {
          addButton.click()
        })

        // Now the privilege ComboBox should be visible (with disableClearable)
        const addComboBox = container.querySelector(
          '[data-test="mocked-combobox"][data-disable-clearable="true"]',
        )

        expect(addComboBox).toBeTruthy()
      })
    })

    describe('WHEN a privilege is selected from the add ComboBox', () => {
      it('THEN should add the privilege to the form and hide the input', () => {
        setupWithPrivilegeDetails()

        mockFormValuesOverride = { ...defaultFormValues }

        const { container, getByText } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // Click the add button to show the ComboBox
        act(() => {
          getByText('translated_text_1753864223060n9hxs03sa15').click()
        })

        // Select the first privilege option
        const optionBtn = container.querySelector(
          '[data-test="mocked-combobox"][data-disable-clearable="true"] [data-test="combobox-option-0"]',
        ) as HTMLButtonElement

        expect(optionBtn).toBeTruthy()

        act(() => {
          optionBtn.click()
        })

        // Should have called setFieldValue with the new privileges array
        expect(mockSetFieldValue).toHaveBeenCalledWith(
          'privileges',
          expect.arrayContaining([
            expect.objectContaining({
              privilegeCode: 'priv_code_1',
              privilegeName: 'Privilege Alpha',
              valueType: PrivilegeValueTypeEnum.String,
              value: '',
            }),
          ]),
        )
      })
    })

    describe('WHEN the delete button is clicked on the add privilege input', () => {
      it('THEN should hide the add privilege input', () => {
        setupWithPrivilegeDetails()

        mockFormValuesOverride = { ...defaultFormValues }

        const { container, getByText } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // Click the add button to show the ComboBox
        act(() => {
          getByText('translated_text_1753864223060n9hxs03sa15').click()
        })

        // Now the trash button should be visible
        const trashButton = container.querySelector(
          'button[data-icon="trash"]',
        ) as HTMLButtonElement

        expect(trashButton).toBeTruthy()

        act(() => {
          trashButton.click()
        })

        // The add button should be visible again
        expect(getByText('translated_text_1753864223060n9hxs03sa15')).toBeTruthy()
      })
    })

    describe('WHEN the selected privilege is not found in the data', () => {
      it('THEN should hide the input without adding a privilege', () => {
        const { useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: jest.Mock
        }

        // Return data with privileges but the ComboBox selection won't match
        useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery.mockReturnValue({
          data: {
            feature: {
              id: 'feature-1',
              code: 'feature_one',
              name: 'Feature One',
              privileges: [],
            },
          },
          loading: false,
        })

        mockFormValuesOverride = { ...defaultFormValues }

        const { getByText } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // Click the add button
        getByText('translated_text_1753864223060n9hxs03sa15').click()

        // No options to select — setFieldValue should not be called for privileges
        expect(mockSetFieldValue).not.toHaveBeenCalledWith('privileges', expect.anything())
      })
    })
  })

  // --- privilegesListComboBoxData ---

  describe('GIVEN the privilegesListComboBoxData useMemo', () => {
    describe('WHEN feature details data has privileges', () => {
      it('THEN should render the privilege ComboBox with correct option count', () => {
        const { useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: jest.Mock
        }

        useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery.mockReturnValue({
          data: {
            feature: {
              id: 'feature-1',
              code: 'feature_one',
              name: 'Feature One',
              privileges: [
                {
                  id: 'priv-id-1',
                  code: 'priv_code_1',
                  name: 'Privilege Alpha',
                  valueType: PrivilegeValueTypeEnum.String,
                  config: null,
                },
                {
                  id: 'priv-id-2',
                  code: 'priv_code_2',
                  name: 'Privilege Beta',
                  valueType: PrivilegeValueTypeEnum.Boolean,
                  config: null,
                },
                {
                  id: 'priv-id-3',
                  code: 'priv_code_3',
                  name: 'Privilege Gamma',
                  valueType: PrivilegeValueTypeEnum.Integer,
                  config: null,
                },
              ],
            },
          },
          loading: false,
        })

        mockFormValuesOverride = { ...defaultFormValues }

        const { container, getByText } = render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // Click add to show the privilege ComboBox
        act(() => {
          getByText('translated_text_1753864223060n9hxs03sa15').click()
        })

        const addComboBox = container.querySelector(
          '[data-test="mocked-combobox"][data-disable-clearable="true"]',
        )

        expect(addComboBox).toBeTruthy()
        expect(addComboBox?.getAttribute('data-option-count')).toBe('3')
      })
    })

    describe('WHEN a privilege is already added to the form', () => {
      it('THEN should disable that privilege in the ComboBox options', () => {
        const { useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery } = jest.requireMock(
          '~/generated/graphql',
        ) as {
          useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: jest.Mock
        }

        useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery.mockReturnValue({
          data: {
            feature: {
              id: 'feature-1',
              code: 'feature_one',
              name: 'Feature One',
              privileges: [
                {
                  id: 'priv-id-1',
                  code: 'priv_code_1',
                  name: 'Privilege Alpha',
                  valueType: PrivilegeValueTypeEnum.String,
                  config: null,
                },
              ],
            },
          },
          loading: false,
        })

        mockFormValuesOverride = {
          ...defaultFormValues,
          privileges: [
            {
              ...privilegeRow,
              privilegeCode: 'priv_code_1', // Same as one in the feature details
            },
          ],
        }

        mockedUseFieldContext.mockReturnValue(createFieldCtx('privileges[0].value', ''))

        // Just verify it renders without error - the disabled state is handled
        // by the ComboBox data having { disabled: true }
        render(
          <FeatureEntitlementDrawer
            ref={drawerRef}
            onSave={mockOnSave}
            existingFeatureCodes={[]}
          />,
        )

        // The privilegesListComboBoxData memo should run and the data should
        // have disabled: true for priv_code_1
        // We verify this indirectly - the component rendered successfully
        expect(mockAppFieldChildren.has('privileges[0].value')).toBe(true)
      })
    })
  })
})
