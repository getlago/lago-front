import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { render } from '~/test-utils'

import CreateAddOn, {
  CREATE_ADD_ON_DESCRIPTION_DELETE_TEST_ID,
  CREATE_ADD_ON_FORM_ID,
} from '../CreateAddOn'

const getNameInput = () => document.querySelector('input[name="name"]') as HTMLInputElement
const getCodeInput = () => document.querySelector('input[name="code"]') as HTMLInputElement
const getAmountInput = () => document.querySelector('input[name="amountCents"]') as HTMLInputElement
const getDescriptionTextarea = () =>
  document.querySelector('textarea[name="description"]') as HTMLTextAreaElement

const mockOnSave = jest.fn()

const mockDefaultUseCreateEditAddOn = {
  isEdition: false,
  loading: false,
  addOn: undefined,
  errorCode: undefined,
  onSave: mockOnSave,
}

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCreateEditAddOn', () => ({
  useCreateEditAddOn: jest.fn(() => mockDefaultUseCreateEditAddOn),
}))

jest.mock('~/components/addOns/AddOnCodeSnippet', () => ({
  AddOnCodeSnippet: jest.fn(() => <div data-test="add-on-code-snippet" />),
}))

jest.mock('~/components/taxes/TaxesSelectorSection', () => ({
  TaxesSelectorSection: jest.fn(() => <div data-test="taxes-selector-section" />),
}))

jest.mock('~/core/utils/domUtils', () => ({
  scrollToTop: jest.fn(),
}))

const mockedUseCreateEditAddOn = useCreateEditAddOn as jest.Mock

describe('CreateAddOn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseCreateEditAddOn.mockReturnValue(mockDefaultUseCreateEditAddOn)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the form is loading', () => {
    describe('WHEN add-on data has not loaded', () => {
      it('THEN should not display form inputs', () => {
        mockedUseCreateEditAddOn.mockReturnValue({
          ...mockDefaultUseCreateEditAddOn,
          loading: true,
        })

        render(<CreateAddOn />)

        expect(getNameInput()).not.toBeInTheDocument()
        expect(getCodeInput()).not.toBeInTheDocument()
        expect(getAmountInput()).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the component renders in create mode', () => {
    describe('WHEN the page loads', () => {
      it('THEN should display the form element', () => {
        render(<CreateAddOn />)

        expect(document.getElementById(CREATE_ADD_ON_FORM_ID)).toBeInTheDocument()
      })

      it('THEN should display the add-on code snippet', () => {
        render(<CreateAddOn />)

        expect(screen.getByTestId('add-on-code-snippet')).toBeInTheDocument()
      })

      it('THEN should display the taxes selector section', () => {
        render(<CreateAddOn />)

        expect(screen.getByTestId('taxes-selector-section')).toBeInTheDocument()
      })

      it.each([
        ['name input', getNameInput],
        ['code input', getCodeInput],
        ['amount input', getAmountInput],
      ])('THEN should display the %s', (_, getInput) => {
        render(<CreateAddOn />)

        expect(getInput()).toBeInTheDocument()
      })

      it('THEN should display the submit button', () => {
        render(<CreateAddOn />)

        expect(screen.getByTestId('submit')).toBeInTheDocument()
      })

      it('THEN should not display the description textarea by default', () => {
        render(<CreateAddOn />)

        expect(getDescriptionTextarea()).not.toBeInTheDocument()
      })
    })

    describe('WHEN show description button is clicked', () => {
      it('THEN should display the description textarea', async () => {
        const user = userEvent.setup()

        render(<CreateAddOn />)

        await user.click(screen.getByTestId('show-description'))

        expect(getDescriptionTextarea()).toBeInTheDocument()
      })
    })

    describe('WHEN description is displayed and delete button is clicked', () => {
      it('THEN should hide the description textarea', async () => {
        const user = userEvent.setup()

        render(<CreateAddOn />)

        await user.click(screen.getByTestId('show-description'))
        expect(getDescriptionTextarea()).toBeInTheDocument()

        await user.click(screen.getByTestId(CREATE_ADD_ON_DESCRIPTION_DELETE_TEST_ID))

        expect(getDescriptionTextarea()).not.toBeInTheDocument()
      })
    })

    describe('WHEN form is filled with valid values and submitted', () => {
      it('THEN should call onSave with the form values', async () => {
        const user = userEvent.setup()

        render(<CreateAddOn />)

        await user.type(getNameInput(), 'My Add-on')
        await user.type(getAmountInput(), '10')

        await user.click(screen.getByTestId('submit'))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'My Add-on',
              amountCents: '10',
              amountCurrency: CurrencyEnum.Usd,
            }),
          )
        })
      })
    })

    describe('WHEN form is submitted without an amount', () => {
      it('THEN should not call onSave', async () => {
        const user = userEvent.setup()

        render(<CreateAddOn />)

        await user.type(getNameInput(), 'My Add-on')

        await user.click(screen.getByTestId('submit'))

        await waitFor(() => {
          expect(screen.getByTestId('submit')).toBeInTheDocument()
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the component renders in edit mode', () => {
    const mockAddOn = {
      id: 'add-on-1',
      name: 'Existing Add-on',
      code: 'EXISTING_ADD_ON',
      description: '',
      amountCents: 1000,
      amountCurrency: CurrencyEnum.Usd,
      taxes: [],
    }

    beforeEach(() => {
      mockedUseCreateEditAddOn.mockReturnValue({
        ...mockDefaultUseCreateEditAddOn,
        isEdition: true,
        addOn: mockAddOn,
      })
    })

    describe('WHEN the page loads with existing add-on data', () => {
      it.each([
        ['name', getNameInput, 'Existing Add-on'],
        ['code', getCodeInput, 'EXISTING_ADD_ON'],
      ])(
        'THEN should populate the %s input with the add-on value',
        (_, getInput, expectedValue) => {
          render(<CreateAddOn />)

          expect(getInput()).toHaveValue(expectedValue)
        },
      )

      it('THEN should disable the submit button when form is not dirty', () => {
        render(<CreateAddOn />)

        expect(screen.getByTestId('submit')).toBeDisabled()
      })
    })

    describe('WHEN the add-on has an existing description', () => {
      it('THEN should display the description textarea on load', () => {
        mockedUseCreateEditAddOn.mockReturnValue({
          ...mockDefaultUseCreateEditAddOn,
          isEdition: true,
          addOn: { ...mockAddOn, description: 'Existing description' },
        })

        render(<CreateAddOn />)

        expect(getDescriptionTextarea()).toBeInTheDocument()
      })
    })
  })
})
