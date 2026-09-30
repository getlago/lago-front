import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  FEATURE_PRIVILEGE_ADD_OPTION_BUTTON_TEST_ID,
  FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID,
  FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID,
  FEATURE_PRIVILEGE_HIDE_OPTIONS_BUTTON_TEST_ID,
  FEATURE_PRIVILEGE_NAME_INPUT_TEST_ID,
} from '~/components/features/FeaturePrivilegeAccordion'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { FeatureForFeatureFormFragment, PrivilegeValueTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import FeatureForm, {
  FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID,
  FEATURE_FORM_CANCEL_BUTTON_TEST_ID,
  FEATURE_FORM_CLOSE_BUTTON_TEST_ID,
  FEATURE_FORM_CODE_INPUT_TEST_ID,
  FEATURE_FORM_DESCRIPTION_DELETE_TEST_ID,
  FEATURE_FORM_DESCRIPTION_INPUT_TEST_ID,
  FEATURE_FORM_NAME_INPUT_TEST_ID,
  FEATURE_FORM_SHOW_DESCRIPTION_BUTTON_TEST_ID,
  FEATURE_FORM_SUBMIT_BUTTON_TEST_ID,
} from '../FeatureForm'

const SELECT_OPTIONS_INPUT_TEST_ID = 'mock-select-options-input'

const buttonSelectorOption = (value: PrivilegeValueTypeEnum) => `button-selector-${value}`

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// The MUI autocomplete popper renders nothing in jsdom. The stub keeps the real
// option-to-string transform the accordion owns, and drops only the popper.
jest.mock('~/components/form/MultipleComboBox/MultipleComboBox', () => ({
  MultipleComboBox: ({
    name,
    value,
    onChange,
  }: {
    name?: string
    value?: { value: string }[]
    onChange: (value: { value: string }[]) => void
  }) => (
    <input
      data-test={SELECT_OPTIONS_INPUT_TEST_ID}
      name={name}
      value={value?.map((option) => option.value).join(',') ?? ''}
      onChange={(event) =>
        onChange(event.target.value.split(',').map((option) => ({ value: option })))
      }
    />
  ),
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => <div data-test={`loading-skeleton-${id}`} />,
}))

const mockCentralizedDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockCentralizedDialogOpen }),
}))

const mockScrollToTop = jest.fn()

jest.mock('~/core/utils/domUtils', () => ({
  ...jest.requireActual('~/core/utils/domUtils'),
  scrollToTop: (...args: unknown[]) => mockScrollToTop(...args),
  scrollToAndClickElement: jest.fn(),
}))

type MutationHookOptions = { onCompleted: (data: Record<string, { id: string }>) => void }

const mockUseGetFeatureQuery = jest.fn()
const mockCreateFeature = jest.fn()
const mockUpdateFeature = jest.fn()
let createFeatureOptions: MutationHookOptions
let updateFeatureOptions: MutationHookOptions

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetFeatureQuery: (...args: unknown[]) => mockUseGetFeatureQuery(...args),
  useCreateFeatureMutation: (options: MutationHookOptions) => {
    createFeatureOptions = options

    return [mockCreateFeature, { error: undefined }]
  },
  useUpdateFeatureMutation: (options: MutationHookOptions) => {
    updateFeatureOptions = options

    return [mockUpdateFeature, { error: undefined }]
  },
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  hasDefinedGQLError: jest.fn(() => false),
}))

const existingFeature: FeatureForFeatureFormFragment = {
  id: 'feature-1',
  name: 'Seats',
  code: 'seats',
  description: 'How many seats',
  privileges: [
    {
      id: 'privilege-1',
      name: 'Tier',
      code: 'tier',
      valueType: PrivilegeValueTypeEnum.Select,
      config: { selectOptions: ['gold', 'silver'] },
    },
  ],
}

// The multiline description renders a `<textarea>`, every other field an `<input>`
const inputIn = (testId: string): HTMLInputElement => {
  const container = screen.getByTestId(testId)

  return (container.querySelector('input, textarea') ?? container) as HTMLInputElement
}

// `useParams` is always passed: the test-utils spy persists across tests, so an
// omitted one would leak the previous test's `featureId` and flip creation mode.
// The stub maps the raw input to one option per comma-separated chunk. It is set
// in one shot: typing it would emit the intermediate `gold,` whose empty chunk
// the accordion legitimately filters out, eating the separator.
const typeSelectOptions = (options: string) =>
  fireEvent.change(screen.getByTestId(SELECT_OPTIONS_INPUT_TEST_ID), {
    target: { value: options },
  })

const deleteIconOf = (label: string): Element | undefined =>
  screen.getByText(label).closest('.MuiChip-root')?.querySelector('svg') ?? undefined

const renderPage = async (useParams: Record<string, string> = {}) =>
  act(() => render(<FeatureForm />, { useParams }))

// An accordion whose privilege already has a code renders collapsed, and MUI
// unmounts collapsed children, so the fields have to be revealed first.
const togglePrivilegeAccordion = async (
  user: ReturnType<typeof userEvent.setup>,
  index: number,
) => {
  const accordion = document.getElementById(`privilege-accordion-${index}`) as HTMLElement

  await user.click(accordion.querySelector('[role="button"]') as HTMLElement)
}

describe('FeatureForm', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used when opening the errored accordion)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetFeatureQuery.mockReturnValue({ data: undefined, loading: false })
    mockCreateFeature.mockResolvedValue({ data: { createFeature: { id: 'feature-1' } } })
    mockUpdateFeature.mockResolvedValue({ data: { updateFeature: { id: 'feature-1' } } })
    ;(hasDefinedGQLError as unknown as jest.Mock).mockReturnValue(false)
  })

  describe('GIVEN the feature is still loading', () => {
    describe('WHEN rendering the page', () => {
      it('THEN should display the skeleton instead of the fields', async () => {
        mockUseGetFeatureQuery.mockReturnValue({ data: undefined, loading: true })

        await renderPage({ featureId: 'feature-1' })

        expect(screen.getByTestId('loading-skeleton-feature-form')).toBeInTheDocument()
        expect(screen.queryByTestId(FEATURE_FORM_NAME_INPUT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a new feature', () => {
    describe('WHEN rendering the page', () => {
      it.each([
        ['close button', FEATURE_FORM_CLOSE_BUTTON_TEST_ID],
        ['cancel button', FEATURE_FORM_CANCEL_BUTTON_TEST_ID],
        ['submit button', FEATURE_FORM_SUBMIT_BUTTON_TEST_ID],
        ['name input', FEATURE_FORM_NAME_INPUT_TEST_ID],
        ['code input', FEATURE_FORM_CODE_INPUT_TEST_ID],
        ['show description button', FEATURE_FORM_SHOW_DESCRIPTION_BUTTON_TEST_ID],
        ['add privilege button', FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID],
      ])('THEN should display the %s', async (_, testId) => {
        await renderPage()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })

    describe('WHEN typing a name', () => {
      it('THEN should derive the code from it', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')

        expect(inputIn(FEATURE_FORM_CODE_INPUT_TEST_ID)).toHaveValue('max_seats')
      })
    })

    describe('WHEN submitting without a code', () => {
      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => expect(mockCreateFeature).not.toHaveBeenCalled())
      })

      it('THEN should scroll to the first errored input', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(scrollToFirstInputError).toHaveBeenCalledWith(
            'feature-form',
            expect.objectContaining({ code: expect.anything() }),
          ),
        )
      })
    })

    describe('WHEN submitting a name, a code and a description', () => {
      it('THEN should create the feature with them', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_SHOW_DESCRIPTION_BUTTON_TEST_ID))
        await user.type(inputIn(FEATURE_FORM_DESCRIPTION_INPUT_TEST_ID), 'A description')
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockCreateFeature).toHaveBeenCalledWith({
            variables: {
              input: {
                code: 'max_seats',
                name: 'Max seats',
                description: 'A description',
                privileges: [],
              },
            },
          }),
        )
      })
    })

    describe('WHEN removing the description that was just added', () => {
      it('THEN should hide the input and submit an empty description', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_SHOW_DESCRIPTION_BUTTON_TEST_ID))
        await user.type(inputIn(FEATURE_FORM_DESCRIPTION_INPUT_TEST_ID), 'A description')
        await user.click(screen.getByTestId(FEATURE_FORM_DESCRIPTION_DELETE_TEST_ID))

        expect(screen.queryByTestId(FEATURE_FORM_DESCRIPTION_INPUT_TEST_ID)).not.toBeInTheDocument()

        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockCreateFeature).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: { input: expect.objectContaining({ description: '' }) },
            }),
          ),
        )
      })
    })

    describe('WHEN the form is untouched', () => {
      it('THEN should leave without prompting on cancel', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.click(screen.getByTestId(FEATURE_FORM_CANCEL_BUTTON_TEST_ID))

        expect(mockCentralizedDialogOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the form has been edited', () => {
      it('THEN should prompt before leaving', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_CLOSE_BUTTON_TEST_ID))

        expect(mockCentralizedDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
      })
    })
  })

  describe('GIVEN privileges are added to a new feature', () => {
    describe('WHEN a boolean privilege is filled in', () => {
      it('THEN should submit it with the feature', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.type(inputIn(FEATURE_PRIVILEGE_NAME_INPUT_TEST_ID), 'Is admin')
        await user.type(inputIn(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID), 'is_admin')
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockCreateFeature).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  privileges: [
                    {
                      name: 'Is admin',
                      code: 'is_admin',
                      valueType: PrivilegeValueTypeEnum.Boolean,
                      config: undefined,
                    },
                  ],
                }),
              },
            }),
          ),
        )
      })
    })

    describe('WHEN a privilege is switched to the select type', () => {
      it('THEN should block the submit until options are added, then send them as strings', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.type(inputIn(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID), 'tier')
        await user.click(screen.getByTestId(buttonSelectorOption(PrivilegeValueTypeEnum.Select)))

        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))
        await waitFor(() => expect(mockCreateFeature).not.toHaveBeenCalled())

        typeSelectOptions('gold')
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockCreateFeature).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  privileges: [
                    {
                      name: '',
                      code: 'tier',
                      valueType: PrivilegeValueTypeEnum.Select,
                      config: { selectOptions: ['gold'] },
                    },
                  ],
                }),
              },
            }),
          ),
        )
      })

      it('THEN should reveal the options input right away, and offer to add it back once hidden', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(buttonSelectorOption(PrivilegeValueTypeEnum.Select)))

        expect(screen.getByTestId(SELECT_OPTIONS_INPUT_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(FEATURE_PRIVILEGE_HIDE_OPTIONS_BUTTON_TEST_ID))

        expect(screen.queryByTestId(SELECT_OPTIONS_INPUT_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(FEATURE_PRIVILEGE_ADD_OPTION_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN one of its freshly added options is removed', () => {
      it('THEN should submit only the remaining ones', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.type(inputIn(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID), 'tier')
        await user.click(screen.getByTestId(buttonSelectorOption(PrivilegeValueTypeEnum.Select)))
        typeSelectOptions('gold,silver')

        await user.click(deleteIconOf('gold') as HTMLElement)
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockCreateFeature).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  privileges: [expect.objectContaining({ config: { selectOptions: ['silver'] } })],
                }),
              },
            }),
          ),
        )
      })
    })

    describe('WHEN a privilege is deleted', () => {
      it('THEN should remove its accordion', async () => {
        const user = userEvent.setup()

        await renderPage()

        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))

        expect(screen.getAllByTestId(FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID)).toHaveLength(2)

        await user.click(screen.getAllByTestId(FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID)[0])

        expect(screen.getAllByTestId(FEATURE_PRIVILEGE_DELETE_BUTTON_TEST_ID)).toHaveLength(1)
      })
    })
  })

  describe('GIVEN an existing feature', () => {
    beforeEach(() => {
      mockUseGetFeatureQuery.mockReturnValue({
        data: { feature: existingFeature },
        loading: false,
      })
    })

    describe('WHEN all edits have been reverted', () => {
      it.each([
        ['cancel', FEATURE_FORM_CANCEL_BUTTON_TEST_ID],
        ['close', FEATURE_FORM_CLOSE_BUTTON_TEST_ID],
      ])('THEN should leave without prompting on %s', async (_, buttonTestId) => {
        const user = userEvent.setup()

        await renderPage({ featureId: 'feature-1' })

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'x')
        await user.keyboard('{Backspace}')

        expect(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID)).toHaveValue(existingFeature.name)

        await user.click(screen.getByTestId(buttonTestId))

        expect(mockCentralizedDialogOpen).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalledWith('/feature/feature-1/overview')
      })
    })

    describe('WHEN rendering the page', () => {
      it('THEN should seed the fields with the saved values', async () => {
        await renderPage({ featureId: 'feature-1' })

        expect(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID)).toHaveValue('Seats')
        expect(inputIn(FEATURE_FORM_CODE_INPUT_TEST_ID)).toHaveValue('seats')
        expect(inputIn(FEATURE_FORM_DESCRIPTION_INPUT_TEST_ID)).toHaveValue('How many seats')
      })

      it('THEN should seed the saved privilege and lock both codes', async () => {
        const user = userEvent.setup()

        await renderPage({ featureId: 'feature-1' })
        await togglePrivilegeAccordion(user, 0)

        expect(inputIn(FEATURE_PRIVILEGE_NAME_INPUT_TEST_ID)).toHaveValue('Tier')
        expect(inputIn(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID)).toHaveValue('tier')
        expect(inputIn(FEATURE_FORM_CODE_INPUT_TEST_ID)).toBeDisabled()
        expect(inputIn(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID)).toBeDisabled()
      })

      it('THEN should keep the saved select options undeletable', async () => {
        const user = userEvent.setup()

        await renderPage({ featureId: 'feature-1' })
        await togglePrivilegeAccordion(user, 0)

        expect(screen.getByText('gold')).toBeInTheDocument()
        expect(deleteIconOf('gold')).toBeUndefined()
      })
    })

    // The Formik form relied on `enableReinitialize` here: the page mounts while
    // the query is still in flight, so the fields must pick the feature up when
    // it lands rather than stay on the empty defaults.
    describe('WHEN it only lands after the first render', () => {
      it('THEN should seed the fields once it has loaded', async () => {
        mockUseGetFeatureQuery.mockReturnValue({ data: undefined, loading: true })

        const { rerender } = await renderPage({ featureId: 'feature-1' })

        mockUseGetFeatureQuery.mockReturnValue({
          data: { feature: existingFeature },
          loading: false,
        })

        await act(async () => {
          rerender(<FeatureForm />)
        })

        expect(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID)).toHaveValue('Seats')
        expect(inputIn(FEATURE_FORM_CODE_INPUT_TEST_ID)).toHaveValue('seats')
      })
    })

    describe('WHEN submitting an edited name', () => {
      it('THEN should update the feature without sending its code', async () => {
        const user = userEvent.setup()

        await renderPage({ featureId: 'feature-1' })

        await user.clear(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID))
        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Renamed')
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(mockUpdateFeature).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'feature-1',
                name: 'Renamed',
                description: 'How many seats',
                privileges: [
                  {
                    name: 'Tier',
                    code: 'tier',
                    valueType: PrivilegeValueTypeEnum.Select,
                    config: { selectOptions: ['gold', 'silver'] },
                  },
                ],
              },
            },
          }),
        )
      })

      it('THEN should notify the success once the mutation completes', async () => {
        await renderPage({ featureId: 'feature-1' })

        act(() => updateFeatureOptions.onCompleted({ updateFeature: { id: 'feature-1' } }))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })

  describe('GIVEN the creation mutation completes', () => {
    describe('WHEN the created feature comes back', () => {
      it('THEN should notify the success and land on its details page', async () => {
        await renderPage()

        act(() => createFeatureOptions.onCompleted({ createFeature: { id: 'feature-42' } }))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        expect(testMockNavigateFn).toHaveBeenCalledWith('/feature/feature-42/overview')
      })
    })
  })

  describe('GIVEN the backend rejects the feature code as already taken', () => {
    describe('WHEN the rejection reaches the page', () => {
      it('THEN should surface the error under the code input and scroll back to the top', async () => {
        ;(hasDefinedGQLError as unknown as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueAlreadyExist',
        )

        await renderPage()

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
        expect(mockScrollToTop).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the backend rejects a duplicated privilege code', () => {
    describe('WHEN submitting two privileges sharing a code', () => {
      it('THEN should surface the error on the second privilege and expand its accordion', async () => {
        const user = userEvent.setup()

        ;(hasDefinedGQLError as unknown as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueIsDuplicated',
        )
        mockCreateFeature.mockResolvedValue({ errors: [{ message: 'duplicated' }] })

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))

        const codeInputs = screen.getAllByTestId(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID)

        await user.type(codeInputs[0].querySelector('input') as HTMLInputElement, 'tier')
        await user.type(codeInputs[1].querySelector('input') as HTMLInputElement, 'tier')
        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
        expect(
          screen.getAllByTestId(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID)[1].querySelector('input'),
        ).toHaveAttribute('aria-invalid', 'true')
      })
    })

    describe('WHEN the privilege accordions are collapsed at submit time', () => {
      it('THEN should still surface the error once the accordion is expanded', async () => {
        const user = userEvent.setup()

        ;(hasDefinedGQLError as unknown as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueIsDuplicated',
        )
        mockCreateFeature.mockResolvedValue({ errors: [{ message: 'duplicated' }] })

        await renderPage()

        await user.type(inputIn(FEATURE_FORM_NAME_INPUT_TEST_ID), 'Max seats')
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(FEATURE_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID))

        const codeInputs = screen.getAllByTestId(FEATURE_PRIVILEGE_CODE_INPUT_TEST_ID)

        await user.type(codeInputs[0].querySelector('input') as HTMLInputElement, 'tier')
        await user.type(codeInputs[1].querySelector('input') as HTMLInputElement, 'tier')

        // Collapsing unmounts the code fields, as a saved feature's accordions already are.
        await togglePrivilegeAccordion(user, 0)
        await togglePrivilegeAccordion(user, 1)

        await user.click(screen.getByTestId(FEATURE_FORM_SUBMIT_BUTTON_TEST_ID))

        // The form expands the offending accordion itself; the error must be there once it is.
        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })
    })
  })
})
