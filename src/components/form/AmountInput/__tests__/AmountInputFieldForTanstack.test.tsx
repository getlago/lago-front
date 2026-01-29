import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
// Import after mocking
import { useFieldContext } from '~/hooks/forms/formContext'
import { render } from '~/test-utils'

import AmountInputField from '../AmountInputFieldForTanstack'

// Mock the field context
const mockHandleChange = jest.fn()
const mockHandleBlur = jest.fn()

const createMockFieldContext = (overrides?: {
  value?: string
  errors?: Array<{ message: string }>
  errorMap?: Record<string, unknown>
}) => ({
  name: 'testAmount',
  state: {
    value: overrides?.value ?? '',
  },
  store: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      meta: {
        errors: overrides?.errors ?? [],
        errorMap: overrides?.errorMap ?? {},
      },
    })),
  },
  handleChange: mockHandleChange,
  handleBlur: mockHandleBlur,
})

jest.mock('~/hooks/forms/formContext', () => ({
  useFieldContext: jest.fn(),
}))

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((store, selector) => selector(store.getState())),
}))

const mockUseFieldContext = useFieldContext as jest.Mock

describe('AmountInputFieldForTanstack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFieldContext.mockReturnValue(createMockFieldContext())
  })

  describe('field context integration', () => {
    it('renders with field name from context', () => {
      render(<AmountInputField currency={CurrencyEnum.Usd} />)

      const input = screen.getByRole('textbox')

      expect(input).toHaveAttribute('name', 'testAmount')
    })

    it('displays value from field context', () => {
      mockUseFieldContext.mockReturnValue(createMockFieldContext({ value: '100' }))

      render(<AmountInputField currency={CurrencyEnum.Usd} />)

      const input = screen.getByRole('textbox')

      expect(input).toHaveValue('100')
    })

    it('calls handleChange when value changes', async () => {
      const user = userEvent.setup()

      render(<AmountInputField currency={CurrencyEnum.Usd} />)

      const input = screen.getByRole('textbox')

      await user.type(input, '50')

      expect(mockHandleChange).toHaveBeenCalled()
    })

    it('calls handleBlur when input loses focus', async () => {
      const user = userEvent.setup()

      render(<AmountInputField currency={CurrencyEnum.Usd} />)

      const input = screen.getByRole('textbox')

      await user.click(input)
      await user.tab()

      expect(mockHandleBlur).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('displays external string error', () => {
      render(<AmountInputField currency={CurrencyEnum.Usd} error="External error message" />)

      expect(screen.getByText('External error message')).toBeInTheDocument()
    })

    it('displays form validation error from context', () => {
      mockUseFieldContext.mockReturnValue(
        createMockFieldContext({
          errors: [{ message: 'Validation failed' }],
        }),
      )

      render(<AmountInputField currency={CurrencyEnum.Usd} />)

      expect(screen.getByText('Validation failed')).toBeInTheDocument()
    })

    it('prioritizes external error over form error', () => {
      mockUseFieldContext.mockReturnValue(
        createMockFieldContext({
          errors: [{ message: 'Form error' }],
        }),
      )

      render(<AmountInputField currency={CurrencyEnum.Usd} error="External error" />)

      expect(screen.getByText('External error')).toBeInTheDocument()
      expect(screen.queryByText('Form error')).not.toBeInTheDocument()
    })

    it('handles boolean true error (shows error state without text)', () => {
      const { container } = render(
        <AmountInputField currency={CurrencyEnum.Usd} error={true} displayErrorText={false} />,
      )

      // The input should have error styling (MUI adds error class)
      const inputWrapper = container.querySelector('.Mui-error')

      expect(inputWrapper).toBeInTheDocument()
    })

    it('hides error when silentError is true', () => {
      mockUseFieldContext.mockReturnValue(
        createMockFieldContext({
          errors: [{ message: 'Should not show' }],
        }),
      )

      render(<AmountInputField currency={CurrencyEnum.Usd} silentError />)

      expect(screen.queryByText('Should not show')).not.toBeInTheDocument()
    })

    it('shows error indicator without text when displayErrorText is false', () => {
      mockUseFieldContext.mockReturnValue(
        createMockFieldContext({
          errors: [{ message: 'Error text hidden' }],
        }),
      )

      const { container } = render(
        <AmountInputField currency={CurrencyEnum.Usd} displayErrorText={false} />,
      )

      // Error text should not be visible
      expect(screen.queryByText('Error text hidden')).not.toBeInTheDocument()

      // But error state should still be applied
      const inputWrapper = container.querySelector('.Mui-error')

      expect(inputWrapper).toBeInTheDocument()
    })
  })

  describe('props passthrough', () => {
    it('passes currency prop to AmountInput', () => {
      // Currency affects the placeholder format - EUR uses 2 decimal places
      render(<AmountInputField currency={CurrencyEnum.Eur} />)

      const input = screen.getByRole('textbox')

      // The component should render without error with the currency prop
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', '0.00')
    })

    it('passes label prop to AmountInput', () => {
      render(<AmountInputField currency={CurrencyEnum.Usd} label="Amount Label" />)

      expect(screen.getByText('Amount Label')).toBeInTheDocument()
    })

    it('passes placeholder prop to AmountInput', () => {
      render(<AmountInputField currency={CurrencyEnum.Usd} placeholder="Enter amount" />)

      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
    })

    it('passes disabled prop to AmountInput', () => {
      render(<AmountInputField currency={CurrencyEnum.Usd} disabled />)

      const input = screen.getByRole('textbox')

      expect(input).toBeDisabled()
    })
  })
})
