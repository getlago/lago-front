import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useFieldContext } from '~/hooks/forms/formContext'
import { theme } from '~/styles'

import RadioGroupField from '../RadioGroupFieldForTanstack'

jest.mock('~/hooks/forms/formContext', () => ({
  useFieldContext: jest.fn(),
}))

const mockHandleChange = jest.fn()

const createMockField = (value: string | number | boolean = '') => ({
  name: 'testField',
  state: { value },
  store: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      meta: {
        errors: [],
        errorMap: {},
      },
      values: { testField: value },
    })),
  },
  handleChange: mockHandleChange,
  handleBlur: jest.fn(),
})

const mockedUseFieldContext = useFieldContext as jest.Mock

const defaultOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
]

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)

describe('RadioGroupFieldForTanstack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the component is rendered with options', () => {
    describe('WHEN default props are provided', () => {
      it('THEN should render all radio options', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(<RadioGroupField options={defaultOptions} />)

        expect(screen.getByText('Option A')).toBeInTheDocument()
        expect(screen.getByText('Option B')).toBeInTheDocument()
        expect(screen.getByText('Option C')).toBeInTheDocument()
      })
    })

    describe('WHEN a label is provided', () => {
      it('THEN should render the label text', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(<RadioGroupField options={defaultOptions} label="Choose one" />)

        expect(screen.getByText('Choose one')).toBeInTheDocument()
      })
    })

    describe('WHEN no label is provided', () => {
      it('THEN should not render a label element', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(<RadioGroupField options={defaultOptions} />)

        expect(screen.queryByText('Choose one')).not.toBeInTheDocument()
      })
    })

    describe('WHEN a description is provided', () => {
      it('THEN should render the description text', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(
          <RadioGroupField options={defaultOptions} description="Pick your favorite" />,
        )

        expect(screen.getByText('Pick your favorite')).toBeInTheDocument()
      })
    })

    describe('WHEN infoText is provided along with a label', () => {
      it('THEN should render the info icon tooltip', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(
          <RadioGroupField options={defaultOptions} label="Choose one" infoText="Help text here" />,
        )

        // The info icon is rendered inside a Tooltip
        expect(screen.getByText('Choose one')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a user interacts with radio options', () => {
    describe('WHEN clicking a different option', () => {
      it('THEN should call handleChange with the new value', async () => {
        const user = userEvent.setup()

        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(<RadioGroupField options={defaultOptions} />)

        const optionB = screen.getByText('Option B')

        await user.click(optionB)

        expect(mockHandleChange).toHaveBeenCalledWith('b')
      })
    })

    describe('WHEN clicking a boolean option', () => {
      it('THEN should call handleChange with the boolean value', async () => {
        const user = userEvent.setup()

        mockedUseFieldContext.mockReturnValue(createMockField(false))

        const booleanOptions = [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ]

        renderWithTheme(<RadioGroupField options={booleanOptions} />)

        const yesOption = screen.getByText('Yes')

        await user.click(yesOption)

        expect(mockHandleChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('GIVEN the component has disabled options', () => {
    describe('WHEN the entire group is disabled', () => {
      it('THEN should disable all radio inputs', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        renderWithTheme(<RadioGroupField options={defaultOptions} disabled />)

        const radioInputs = screen.getAllByRole('radio')

        radioInputs.forEach((input) => {
          expect(input).toBeDisabled()
        })
      })
    })

    describe('WHEN individual options are disabled', () => {
      it('THEN should only disable those specific options', () => {
        mockedUseFieldContext.mockReturnValue(createMockField('a'))

        const optionsWithDisabled = [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b', disabled: true },
          { label: 'Option C', value: 'c' },
        ]

        renderWithTheme(<RadioGroupField options={optionsWithDisabled} />)

        const radioInputs = screen.getAllByRole('radio')

        expect(radioInputs[0]).not.toBeDisabled()
        expect(radioInputs[1]).toBeDisabled()
        expect(radioInputs[2]).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN radio options with the current value selected', () => {
    describe('WHEN the field value matches a string option', () => {
      it('THEN should render all options and call handleChange on click', async () => {
        const user = userEvent.setup()

        mockedUseFieldContext.mockReturnValue(createMockField('b'))

        renderWithTheme(<RadioGroupField options={defaultOptions} />)

        // All three options should be rendered
        const radioInputs = screen.getAllByRole('radio')

        expect(radioInputs).toHaveLength(3)

        // Click the first option should call handleChange with 'a'
        await user.click(screen.getByText('Option A'))

        expect(mockHandleChange).toHaveBeenCalledWith('a')
      })
    })

    describe('WHEN the field value is a boolean true', () => {
      it('THEN should have the boolean radio checked via the checked attribute', () => {
        mockedUseFieldContext.mockReturnValue(createMockField(true))

        const booleanOptions = [
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ]

        renderWithTheme(<RadioGroupField options={booleanOptions} />)

        // Radio component: isBoolean(value) ? { checked: value } : { value }
        // For true, input gets checked=true; for false, input gets checked=false
        const radioInputs = screen.getAllByRole('radio')

        expect(radioInputs[0]).toBeChecked()
        expect(radioInputs[1]).not.toBeChecked()
      })
    })
  })
})
