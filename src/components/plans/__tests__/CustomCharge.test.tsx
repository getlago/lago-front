import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useChargeFormContext, usePropertyValues } from '~/contexts/ChargeFormContext'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CUSTOM_CHARGE_JSON_EDITOR_TEST_ID, CustomCharge } from '../CustomCharge'

// --- Mocks ---

const mockSetFieldValue = jest.fn()
const mockOpenDrawer = jest.fn()

jest.mock('~/contexts/ChargeFormContext', () => ({
  useChargeFormContext: jest.fn(),
  usePropertyValues: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/components/form', () => ({
  JsonEditor: (props: Record<string, unknown>) => (
    <div
      data-test="mock-json-editor"
      data-name={props.name as string}
      data-disabled={String(props.disabled)}
      data-value={props.value as string | undefined}
    >
      <button
        data-test="mock-json-editor-expand"
        onClick={() => (props.onExpand as () => void)?.()}
      />
    </div>
  ),
}))

jest.mock('~/components/plans/EditCustomChargeDrawer', () => {
  const React = jest.requireActual('react')

  const MockEditCustomChargeDrawer = React.forwardRef(
    (props: { onSubmit: (value: string) => void }, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        openDrawer: mockOpenDrawer,
        closeDrawer: jest.fn(),
      }))

      return (
        <div data-test="mock-edit-custom-charge-drawer">
          <button
            data-test="mock-drawer-submit"
            onClick={() => props.onSubmit('{"key":"value"}')}
          />
        </div>
      )
    },
  )

  MockEditCustomChargeDrawer.displayName = 'EditCustomChargeDrawer'

  return { EditCustomChargeDrawer: MockEditCustomChargeDrawer }
})

const mockedUseChargeFormContext = useChargeFormContext as jest.MockedFunction<
  typeof useChargeFormContext
>
const mockedUsePropertyValues = usePropertyValues as jest.MockedFunction<typeof usePropertyValues>

// --- Helpers ---

const setupDefaultMocks = (overrides?: { disabled?: boolean; customProperties?: string }) => {
  mockedUseChargeFormContext.mockReturnValue({
    form: {
      setFieldValue: mockSetFieldValue,
    },
    propertyCursor: 'properties',
    currency: CurrencyEnum.Usd,
    disabled: overrides?.disabled ?? false,
    chargePricingUnitShortName: undefined,
  })

  mockedUsePropertyValues.mockReturnValue({
    customProperties: overrides?.customProperties ?? '{"test": true}',
  })
}

// --- Tests ---

describe('CustomCharge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN it mounts', () => {
      it('THEN should render the JSON editor wrapper', () => {
        render(<CustomCharge />)

        const wrapper = screen.getByTestId(CUSTOM_CHARGE_JSON_EDITOR_TEST_ID)

        expect(wrapper).toBeInTheDocument()
      })

      it('THEN should render the JSON editor with the correct name', () => {
        render(<CustomCharge />)

        const editor = screen.getByTestId('mock-json-editor')

        expect(editor).toHaveAttribute('data-name', 'properties.customProperties')
      })

      it('THEN should render the JSON editor with the current value', () => {
        render(<CustomCharge />)

        const editor = screen.getByTestId('mock-json-editor')

        expect(editor).toHaveAttribute('data-value', '{"test": true}')
      })

      it('THEN should render the edit drawer', () => {
        render(<CustomCharge />)

        const drawer = screen.getByTestId('mock-edit-custom-charge-drawer')

        expect(drawer).toBeInTheDocument()
      })
    })

    describe('WHEN disabled is false', () => {
      it('THEN should render the JSON editor as enabled', () => {
        render(<CustomCharge />)

        const editor = screen.getByTestId('mock-json-editor')

        expect(editor).toHaveAttribute('data-disabled', 'false')
      })
    })

    describe('WHEN disabled is true', () => {
      it('THEN should render the JSON editor as disabled', () => {
        setupDefaultMocks({ disabled: true })

        render(<CustomCharge />)

        const editor = screen.getByTestId('mock-json-editor')

        expect(editor).toHaveAttribute('data-disabled', 'true')
      })
    })
  })

  describe('GIVEN the drawer submit callback', () => {
    describe('WHEN the drawer submits a value', () => {
      it('THEN should update the form field with the submitted value', async () => {
        const user = userEvent.setup()

        render(<CustomCharge />)

        const submitButton = screen.getByTestId('mock-drawer-submit')
        await user.click(submitButton)

        expect(mockSetFieldValue).toHaveBeenCalledWith(
          'properties.customProperties',
          '{"key":"value"}',
        )
      })
    })
  })

  describe('GIVEN the JSON editor expand action', () => {
    describe('WHEN the expand button is clicked', () => {
      it('THEN should open the drawer with the current custom properties', async () => {
        const user = userEvent.setup()

        render(<CustomCharge />)

        const expandButton = screen.getByTestId('mock-json-editor-expand')
        await user.click(expandButton)

        expect(mockOpenDrawer).toHaveBeenCalledWith({
          customProperties: '{"test": true}',
        })
      })
    })
  })
})
