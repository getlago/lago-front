import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { render, testMockNavigateFn } from '~/test-utils'

import CreatePricingUnit, {
  CREATE_PRICING_UNIT_CLOSE_BUTTON_TEST_ID,
  CREATE_PRICING_UNIT_DESCRIPTION_DELETE_TEST_ID,
  CREATE_PRICING_UNIT_FORM_ID,
  CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID,
} from '../CreatePricingUnit'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => (
    <div data-test={`form-loading-skeleton-${id}`} />
  ),
}))

const mockUseGetSinglePricingUnitQuery = jest.fn()
const mockCreatePricingUnit = jest.fn()
const mockUpdatePricingUnit = jest.fn()

type MutationOptions = { onCompleted?: (data: Record<string, unknown>) => void }

// Apollo calls `onCompleted` with the mutation's `data` once it resolves — reproduce that
// here since the mutation hooks are fully mocked and Apollo never actually runs.
const withOnCompleted =
  (mock: jest.Mock) =>
  (options?: MutationOptions): [(...args: unknown[]) => Promise<unknown>] => [
    async (...args: unknown[]) => {
      const result = (await mock(...args)) as { data?: Record<string, unknown> }

      if (result?.data) {
        options?.onCompleted?.(result.data)
      }

      return result
    },
  ]

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSinglePricingUnitQuery: (...args: unknown[]) => mockUseGetSinglePricingUnitQuery(...args),
  useCreatePricingUnitMutation: (options?: MutationOptions) =>
    withOnCompleted(mockCreatePricingUnit)(options),
  useUpdatePricingUnitMutation: (options?: MutationOptions) =>
    withOnCompleted(mockUpdatePricingUnit)(options),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  hasDefinedGQLError: jest.fn(() => false),
}))

const existingPricingUnit = {
  id: 'pricing-unit-1',
  name: 'Existing Unit',
  code: 'existing_unit',
  description: 'Existing description',
  shortName: 'EXU',
}

const mockLoadedQuery = (pricingUnit?: typeof existingPricingUnit) => {
  mockUseGetSinglePricingUnitQuery.mockReturnValue({
    data: pricingUnit ? { pricingUnit } : undefined,
    loading: false,
  })
}

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const getDescriptionTextarea = () =>
  document.querySelector('textarea[name="description"]') as HTMLTextAreaElement

// The test-utils `useParams` spy leaks its last value across tests (it is never reset),
// so every render must pass an explicit value instead of relying on the unmocked default.
const renderInCreateMode = () => render(<CreatePricingUnit />, { useParams: {} })

const renderInEditionMode = () =>
  render(<CreatePricingUnit />, { useParams: { pricingUnitId: 'pricing-unit-1' } })

describe('CreatePricingUnit', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used by scrollToFirstInputError on invalid submit)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreatePricingUnit.mockResolvedValue({
      data: { createPricingUnit: { id: 'pricing-unit-1' } },
      errors: undefined,
    })
    mockUpdatePricingUnit.mockResolvedValue({
      data: { updatePricingUnit: { id: 'pricing-unit-1' } },
      errors: undefined,
    })
  })

  describe('GIVEN loading state', () => {
    it('THEN should display the loading skeleton', () => {
      mockUseGetSinglePricingUnitQuery.mockReturnValue({ data: undefined, loading: true })

      renderInEditionMode()

      expect(screen.getByTestId('form-loading-skeleton-create-pricing-unit')).toBeInTheDocument()
    })
  })

  describe('GIVEN create mode', () => {
    beforeEach(() => {
      mockLoadedQuery()
    })

    describe('WHEN the page loads', () => {
      it('THEN should display the form', () => {
        renderInCreateMode()

        expect(document.getElementById(CREATE_PRICING_UNIT_FORM_ID)).toBeInTheDocument()
      })

      it.each([['name'], ['code'], ['shortName']])(
        'THEN should display an empty %s input',
        (name) => {
          renderInCreateMode()

          expect(getInput(name)).toHaveValue('')
        },
      )

      it('THEN should not display the description textarea by default', () => {
        renderInCreateMode()

        expect(getDescriptionTextarea()).not.toBeInTheDocument()
      })

      it('THEN should enable the code input', () => {
        renderInCreateMode()

        expect(getInput('code')).not.toBeDisabled()
      })
    })

    describe('WHEN typing a name', () => {
      it('THEN should derive the code from it', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')

        expect(getInput('code')).toHaveValue('my_unit')
      })

      it('THEN should stop deriving it once the code has been edited', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('code'), 'custom-code')
        await user.tab()
        await user.type(getInput('name'), 'My Unit')

        expect(getInput('code')).toHaveValue('custom-code')
      })
    })

    describe('WHEN toggling the description', () => {
      it('THEN should display then hide the description textarea', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.click(screen.getByTestId('show-description'))
        expect(getDescriptionTextarea()).toBeInTheDocument()

        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_DESCRIPTION_DELETE_TEST_ID))
        expect(getDescriptionTextarea()).not.toBeInTheDocument()
      })
    })

    describe('WHEN submitting without required fields', () => {
      it('THEN should not call the create mutation', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        })
        expect(mockCreatePricingUnit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the short name is too long', () => {
      it('THEN should show a validation error and not call the mutation', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.type(getInput('shortName'), 'TOOLONG')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId('text-field-error')).toBeInTheDocument()
        })
        expect(mockCreatePricingUnit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting a valid form', () => {
      it('THEN should call the create mutation with the code and values', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.type(getInput('shortName'), 'MYU')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockCreatePricingUnit).toHaveBeenCalledWith({
            variables: {
              input: {
                code: 'my_unit',
                name: 'My Unit',
                description: '',
                shortName: 'MYU',
              },
            },
          })
        })
      })

      it('THEN should show a success toast and navigate away', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.type(getInput('shortName'), 'MYU')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })

    describe('WHEN pressing Enter while an input is focused', () => {
      it('THEN should submit the form', async () => {
        const user = userEvent.setup()

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.type(getInput('shortName'), 'MYU')

        getInput('shortName').focus()
        await user.keyboard('{Enter}')

        await waitFor(() => {
          expect(mockCreatePricingUnit).toHaveBeenCalled()
        })
      })
    })

    describe('WHEN the code already exists', () => {
      it('THEN should keep the user on the form without a toast', async () => {
        const user = userEvent.setup()

        mockCreatePricingUnit.mockResolvedValue({
          data: undefined,
          errors: [{ message: 'ValueAlreadyExist' }],
        })
        ;(hasDefinedGQLError as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueAlreadyExist',
        )

        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.type(getInput('shortName'), 'MYU')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockCreatePricingUnit).toHaveBeenCalled()
        })
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a dirty form', () => {
    describe('WHEN closing it', () => {
      it('THEN should ask the user to confirm', async () => {
        const user = userEvent.setup()

        mockLoadedQuery()
        renderInCreateMode()

        await user.type(getInput('name'), 'My Unit')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_CLOSE_BUTTON_TEST_ID))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a pristine form', () => {
    describe('WHEN closing it', () => {
      it('THEN should leave without confirmation', async () => {
        const user = userEvent.setup()

        mockLoadedQuery()
        renderInCreateMode()

        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_CLOSE_BUTTON_TEST_ID))

        expect(mockDialogOpen).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN edition mode', () => {
    beforeEach(() => {
      mockLoadedQuery(existingPricingUnit)
    })

    describe('WHEN the form is loaded', () => {
      it.each([
        ['name', 'Existing Unit'],
        ['code', 'existing_unit'],
        ['shortName', 'EXU'],
      ])('THEN should prefill the %s input', async (name, expected) => {
        renderInEditionMode()

        await waitFor(() => {
          expect(getInput(name)).toHaveValue(expected)
        })
      })

      it('THEN should display the existing description', async () => {
        renderInEditionMode()

        await waitFor(() => {
          expect(getDescriptionTextarea()).toBeInTheDocument()
        })
      })

      it('THEN should disable the code input', async () => {
        renderInEditionMode()

        await waitFor(() => {
          expect(getInput('code')).toBeDisabled()
        })
      })

      it('THEN should disable the submit button while pristine', async () => {
        renderInEditionMode()

        await waitFor(() => {
          expect(getInput('name')).toHaveValue('Existing Unit')
        })
        expect(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN typing a new name', () => {
      it('THEN should not auto-generate the code', async () => {
        const user = userEvent.setup()

        renderInEditionMode()

        await waitFor(() => {
          expect(getInput('name')).toHaveValue('Existing Unit')
        })

        await user.clear(getInput('name'))
        await user.type(getInput('name'), 'Renamed Unit')

        expect(getInput('code')).toHaveValue('existing_unit')
      })
    })

    describe('WHEN submitting an update', () => {
      it('THEN should call the update mutation without the code', async () => {
        const user = userEvent.setup()

        renderInEditionMode()

        await waitFor(() => {
          expect(getInput('name')).toHaveValue('Existing Unit')
        })

        await user.clear(getInput('name'))
        await user.type(getInput('name'), 'Renamed Unit')
        await user.click(screen.getByTestId(CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(mockUpdatePricingUnit).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'pricing-unit-1',
                name: 'Renamed Unit',
                description: 'Existing description',
                shortName: 'EXU',
              },
            },
          })
        })
      })
    })
  })
})
