import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { PrivilegeValueInputComponent } from '../PrivilegeValueInputComponent'

// --- Mocks ---

const mockOnChange = jest.fn()
const mockTranslate = jest.fn((key: string) => key) as unknown as Parameters<
  typeof PrivilegeValueInputComponent
>[0]['translate']

const defaultProps = {
  value: '',
  onChange: mockOnChange,
  translate: mockTranslate,
}

describe('PrivilegeValueInputComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the valueType is Select', () => {
    const selectProps = {
      ...defaultProps,
      valueType: PrivilegeValueTypeEnum.Select,
      config: { selectOptions: ['option_a', 'option_b', 'option_c'] },
    }

    describe('WHEN the component is rendered', () => {
      it('THEN should render a ComboBox', () => {
        const { container } = render(<PrivilegeValueInputComponent {...selectProps} />)

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
      })
    })

    describe('WHEN config has no selectOptions', () => {
      it('THEN should render with empty data', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...selectProps} config={{ selectOptions: null }} />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
      })
    })

    describe('WHEN a value is provided', () => {
      it('THEN should display the value', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...selectProps} value="option_a" />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input.value).toBe('option_a')
      })
    })
  })

  describe('GIVEN the valueType is Boolean', () => {
    const booleanProps = {
      ...defaultProps,
      valueType: PrivilegeValueTypeEnum.Boolean,
    }

    describe('WHEN the component is rendered', () => {
      it('THEN should render a ComboBox', () => {
        const { container } = render(<PrivilegeValueInputComponent {...booleanProps} />)

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
      })
    })

    describe('WHEN a value is provided', () => {
      it('THEN should have a non-empty input value', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...booleanProps} value="true" />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input.value).not.toBe('')
      })
    })
  })

  describe('GIVEN the valueType is String', () => {
    const stringProps = {
      ...defaultProps,
      valueType: PrivilegeValueTypeEnum.String,
    }

    describe('WHEN the component is rendered', () => {
      it('THEN should render a TextInput', () => {
        const { container } = render(<PrivilegeValueInputComponent {...stringProps} />)

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
      })
    })

    describe('WHEN a value is provided', () => {
      it('THEN should display the value', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...stringProps} value="hello" />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input.value).toBe('hello')
      })
    })
  })

  describe('GIVEN the valueType is Integer', () => {
    const integerProps = {
      ...defaultProps,
      valueType: PrivilegeValueTypeEnum.Integer,
    }

    describe('WHEN the component is rendered', () => {
      it('THEN should render a TextInput', () => {
        const { container } = render(<PrivilegeValueInputComponent {...integerProps} />)

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toBeInTheDocument()
      })
    })

    describe('WHEN a value is provided', () => {
      it('THEN should display the value', () => {
        const { container } = render(<PrivilegeValueInputComponent {...integerProps} value="42" />)

        const input = container.querySelector('input') as HTMLInputElement

        expect(input.value).toBe('42')
      })
    })
  })

  describe('GIVEN an error on the value', () => {
    describe.each([
      ['Select', PrivilegeValueTypeEnum.Select],
      ['Boolean', PrivilegeValueTypeEnum.Boolean],
      ['Integer', PrivilegeValueTypeEnum.Integer],
    ])('WHEN the valueType is %s', (_, valueType) => {
      it('THEN should flag the input as invalid', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...defaultProps} valueType={valueType} error />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toHaveAttribute('aria-invalid', 'true')
      })

      it('THEN should leave the input valid without the error flag', () => {
        const { container } = render(
          <PrivilegeValueInputComponent {...defaultProps} valueType={valueType} />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toHaveAttribute('aria-invalid', 'false')
      })
    })
  })

  describe('GIVEN a field name', () => {
    describe.each([
      ['Select', PrivilegeValueTypeEnum.Select],
      ['Boolean', PrivilegeValueTypeEnum.Boolean],
      ['Integer', PrivilegeValueTypeEnum.Integer],
    ])('WHEN the valueType is %s', (_, valueType) => {
      // `scrollToFirstInputError` looks the errored field up by `input.name`.
      it('THEN should forward it to the rendered input', () => {
        const { container } = render(
          <PrivilegeValueInputComponent
            {...defaultProps}
            valueType={valueType}
            name="privileges[0].value"
          />,
        )

        const input = container.querySelector('input') as HTMLInputElement

        expect(input).toHaveAttribute('name', 'privileges[0].value')
      })
    })
  })
})
