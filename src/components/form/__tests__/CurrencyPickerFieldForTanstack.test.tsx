import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CURRENCY_PICKER_DATA_TEST } from '~/components/form/CurrencyPicker'
import CurrencyPickerField from '~/components/form/CurrencyPickerFieldForTanstack'
import { CurrencyEnum } from '~/generated/graphql'
import { useFieldContext } from '~/hooks/forms/formContext'

const mockTranslate = jest.fn((key: string) => `translated_${key}`)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
}))

const mockHandleChange = jest.fn()

const createMockField = (
  value: CurrencyEnum | undefined = undefined,
  errors: Array<{ message: string }> = [],
) => ({
  name: 'currency',
  state: { value },
  store: {
    subscribe: jest.fn(() => jest.fn()),
    getState: jest.fn(() => ({
      meta: {
        errors,
        errorMap: {},
      },
      values: { currency: value },
    })),
  },
  handleChange: mockHandleChange,
  handleBlur: jest.fn(),
})

jest.mock('~/hooks/forms/formContext', () => ({
  useFieldContext: jest.fn(),
}))

jest.mock('@tanstack/react-form', () => ({
  useStore: jest.fn((store, selector) => selector(store.getState())),
}))

const mockedUseFieldContext = useFieldContext as jest.Mock

describe('CurrencyPickerFieldForTanstack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the field has a value', () => {
    describe('WHEN the picker renders', () => {
      it('THEN should display the currency picker with the field value', () => {
        mockedUseFieldContext.mockReturnValue(createMockField(CurrencyEnum.Eur))

        const { container } = render(<CurrencyPickerField />)

        const input = container.querySelector(
          `[data-test="${CURRENCY_PICKER_DATA_TEST}"] input, input[data-test="${CURRENCY_PICKER_DATA_TEST}"]`,
        ) as HTMLInputElement

        expect(input).toHaveValue(CurrencyEnum.Eur)
      })
    })
  })

  describe('GIVEN the picker is clearable', () => {
    describe('WHEN the user clears the selected currency', () => {
      it('THEN should reset the field value to undefined', async () => {
        const user = userEvent.setup()

        mockedUseFieldContext.mockReturnValue(createMockField(CurrencyEnum.Usd))

        const { container } = render(<CurrencyPickerField clearable />)

        const clearButton = container.querySelector(
          '.MuiAutocomplete-clearIndicator',
        ) as HTMLButtonElement

        await user.click(clearButton)

        expect(mockHandleChange).toHaveBeenCalledWith(undefined)
      })
    })

    describe('WHEN clearable is not set', () => {
      it('THEN should not render a clear button', () => {
        mockedUseFieldContext.mockReturnValue(createMockField(CurrencyEnum.Usd))

        const { container } = render(<CurrencyPickerField />)

        expect(container.querySelector('.MuiAutocomplete-clearIndicator')).toBeNull()
      })
    })
  })

  describe('GIVEN the picker is disabled', () => {
    describe('WHEN rendering', () => {
      it('THEN should disable the input', () => {
        mockedUseFieldContext.mockReturnValue(createMockField(CurrencyEnum.Usd))

        const { container } = render(<CurrencyPickerField disabled />)

        const input = container.querySelector(
          `[data-test="${CURRENCY_PICKER_DATA_TEST}"] input, input[data-test="${CURRENCY_PICKER_DATA_TEST}"]`,
        ) as HTMLInputElement

        expect(input).toBeDisabled()
      })
    })
  })

  describe('GIVEN the field has validation errors', () => {
    describe('WHEN the picker renders', () => {
      it('THEN should display the translated error', () => {
        mockedUseFieldContext.mockReturnValue(
          createMockField(undefined, [{ message: 'error_key' }]),
        )

        render(<CurrencyPickerField />)

        expect(screen.getByText('translated_error_key')).toBeInTheDocument()
      })
    })
  })
})
