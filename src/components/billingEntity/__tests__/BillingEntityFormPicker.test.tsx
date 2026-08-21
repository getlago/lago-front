import { configure, render, screen } from '@testing-library/react'

import { BILLING_ENTITY_INHERIT_CODE } from '~/hooks/useBillingEntitiesOptions'

import { BILLING_ENTITY_FORM_PICKER_DATA_TEST } from '../BillingEntityFormPicker'

configure({ testIdAttribute: 'data-test' })

const mockOnChange = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockOptions = [
  {
    id: 'entity-1',
    value: 'code-1',
    label: 'Entity One (default)',
    name: 'Entity One',
    isDefault: true,
  },
  { id: 'entity-2', value: 'code-2', label: 'Entity Two', name: 'Entity Two', isDefault: false },
]

const INHERIT_OPTION = {
  id: '',
  value: BILLING_ENTITY_INHERIT_CODE,
  label: 'Use customer default',
  isDefault: false,
}

const mockUseBillingEntitiesOptions = jest.fn()

jest.mock('~/hooks/useBillingEntitiesOptions', () => ({
  ...jest.requireActual('~/hooks/useBillingEntitiesOptions'),
  useBillingEntitiesOptions: (params?: { includeInheritOption?: boolean }) =>
    mockUseBillingEntitiesOptions(params),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({ debouncedSearch: jest.fn(), isLoading: false }),
}))

jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({
    value,
    onChange,
    'data-test': dataTest,
    data,
  }: {
    value?: string
    onChange: (v: string) => void
    'data-test'?: string
    data?: Array<{ id: string; value: string }>
  }) => (
    <div data-test={dataTest}>
      <span data-test="combo-value">{value ?? ''}</span>
      {data?.map((item) => (
        <button
          key={item.value}
          data-test={`option-${item.value}`}
          onClick={() => onChange(item.value)}
        >
          {item.value}
        </button>
      ))}
    </div>
  ),
}))

describe('BillingEntityFormPicker', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { BillingEntityFormPicker } = require('../BillingEntityFormPicker')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseBillingEntitiesOptions.mockImplementation((params) => ({
      options: params?.includeInheritOption ? [INHERIT_OPTION, ...mockOptions] : mockOptions,
      isLoading: false,
    }))
  })

  describe('GIVEN the org has billing entities', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the picker', () => {
        render(<BillingEntityFormPicker value="entity-1" onChange={mockOnChange} />)

        expect(screen.getByTestId(BILLING_ENTITY_FORM_PICKER_DATA_TEST)).toBeInTheDocument()
      })

      it('THEN should resolve the current value to its code', () => {
        render(<BillingEntityFormPicker value="entity-1" onChange={mockOnChange} />)

        expect(screen.getByTestId('combo-value')).toHaveTextContent('code-1')
      })
    })

    describe('WHEN a code is selected', () => {
      it('THEN should call onChange with the corresponding entity id', () => {
        render(<BillingEntityFormPicker value={undefined} onChange={mockOnChange} />)

        screen.getByTestId('option-code-2').click()

        expect(mockOnChange).toHaveBeenCalledWith('entity-2')
      })
    })
  })
  describe('GIVEN the inherit option is not requested', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not ask the hook for the sentinel', () => {
        render(<BillingEntityFormPicker value="entity-1" onChange={mockOnChange} />)

        expect(mockUseBillingEntitiesOptions).toHaveBeenCalledWith({ includeInheritOption: false })
      })

      it('THEN should not offer an inherit choice', () => {
        render(<BillingEntityFormPicker value="entity-1" onChange={mockOnChange} />)

        expect(
          screen.queryByTestId(`option-${BILLING_ENTITY_INHERIT_CODE}`),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the inherit option is requested', () => {
    describe('WHEN the component renders', () => {
      it('THEN should forward the flag to the hook', () => {
        render(<BillingEntityFormPicker includeInheritOption value="" onChange={mockOnChange} />)

        expect(mockUseBillingEntitiesOptions).toHaveBeenCalledWith({ includeInheritOption: true })
      })

      it('THEN should offer the inherit choice', () => {
        render(<BillingEntityFormPicker includeInheritOption value="" onChange={mockOnChange} />)

        expect(screen.getByTestId(`option-${BILLING_ENTITY_INHERIT_CODE}`)).toBeInTheDocument()
      })
    })

    describe('WHEN the inherit choice is selected', () => {
      it('THEN should report undefined, so the caller can submit null', () => {
        render(
          <BillingEntityFormPicker includeInheritOption value="entity-2" onChange={mockOnChange} />,
        )

        screen.getByTestId(`option-${BILLING_ENTITY_INHERIT_CODE}`).click()

        expect(mockOnChange).toHaveBeenCalledWith(undefined)
      })
    })
  })
  describe('GIVEN the form carries no billing entity', () => {
    describe.each([
      ['an empty string', ''],
      ['undefined', undefined],
      ['null', null],
    ])('WHEN the value is %s and the inherit option is offered', (_, value) => {
      it('THEN should resolve to the inherit option, so it renders as a real selection', () => {
        render(
          <BillingEntityFormPicker includeInheritOption value={value} onChange={mockOnChange} />,
        )

        expect(screen.getByTestId('combo-value')).toHaveTextContent(BILLING_ENTITY_INHERIT_CODE)
      })
    })

    describe('WHEN the inherit option is NOT offered', () => {
      it('THEN should stay unselected rather than inventing a value', () => {
        render(<BillingEntityFormPicker value="" onChange={mockOnChange} />)

        expect(screen.getByTestId('combo-value')).toHaveTextContent('')
      })
    })
  })
})
