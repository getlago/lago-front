import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'
import { ComponentProps } from 'react'

import { initializeTranslations } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  CreateSelfServeOrganizationMutation,
  CreateSelfServeOrganizationMutationVariables,
  LagoApiError,
  SignupRoleEnum,
  SignupSourceEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_NAME_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID,
  SELF_SERVE_CREATE_ORGANIZATION_SUBMIT_BUTTON_TEST_ID,
} from '../../signUpTestIds'
import { CreateOrganizationForm } from '../CreateOrganizationForm'

type CreateOrganizationFormProps = ComponentProps<typeof CreateOrganizationForm>
type MutationResult = {
  data?: CreateSelfServeOrganizationMutation | null
  errors?: GraphQLFormattedError[]
}

const mockCreateOrganization = jest.fn<
  Promise<MutationResult>,
  [{ variables: CreateSelfServeOrganizationMutationVariables }]
>()
const mockUseCreateSelfServeOrganizationMutation = jest.fn()
const mockOnUserNotEligible = jest.fn<Promise<void>, []>()
const mockNavigate = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateSelfServeOrganizationMutation: (...args: unknown[]) =>
    mockUseCreateSelfServeOrganizationMutation(...args),
}))

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (config: { count: number; estimateSize: (index: number) => number }) => ({
    getVirtualItems: () =>
      Array.from({ length: config.count }, (_, index) => ({
        index,
        key: index,
        size: config.estimateSize(index),
        start: index * config.estimateSize(index),
      })),
    getTotalSize: () => config.count * config.estimateSize(0),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

const EMAIL = 'raffi@hooli.com'
const PREFILLED_NAME = 'Hooli'
const LANDING_SLUG = 'hooli-sandbox'

const ROLE_LABELS = [
  'Engineering',
  'Finance',
  'Founder',
  'Product Management',
  'Data',
  'Leadership',
  'Other',
]
const SOURCE_LABELS = [
  'AI Search (Claude, ChatGPT, etc.)',
  'Github',
  'HackerNews',
  'Reference',
  'Y Combinator',
  'Search Engine',
  'Other',
]

const ROLE_PLACEHOLDER_COPY = 'Select a role'
const SOURCE_PLACEHOLDER_COPY = 'Select a reason'

const NAME_REQUIRED_COPY = 'Organization name is required'
const NAME_TOO_LONG_COPY = 'Organization name must be 100 characters or fewer'
const NAME_CONTAINS_LINK_COPY = "Organization name can't contain links"
const SIGN_UP_UNAVAILABLE_COPY = 'Sign-up is unavailable right now. Please reload the page.'
const TOO_MANY_ATTEMPTS_COPY = 'Too many attempts. Please wait a few minutes and try again.'
const GENERIC_ERROR_COPY = 'Something went wrong on our side. Please try again.'

const SUCCESS_RESULT: MutationResult = {
  data: {
    createSelfServeOrganization: {
      landingOrganization: { id: 'org-sandbox', slug: LANDING_SLUG },
      user: { id: 'user-1', email: EMAIL, premium: false, csAdmin: false, memberships: [] },
    },
  },
}

const buildError = (extensions: Record<string, unknown>): MutationResult => ({
  data: null,
  errors: [{ message: 'error', extensions }],
})

const renderForm = (props: Partial<CreateOrganizationFormProps> = {}): void => {
  render(
    <CreateOrganizationForm email={EMAIL} onUserNotEligible={mockOnUserNotEligible} {...props} />,
  )
}

const getNameInput = (): HTMLInputElement =>
  screen
    .getByTestId(SELF_SERVE_CREATE_ORGANIZATION_NAME_FIELD_TEST_ID)
    .querySelector('input') as HTMLInputElement

const getComboBoxInput = (testId: string): HTMLInputElement =>
  within(screen.getByTestId(testId)).getByRole('combobox') as HTMLInputElement

const getSubmitButton = (): HTMLElement =>
  screen.getByTestId(SELF_SERVE_CREATE_ORGANIZATION_SUBMIT_BUTTON_TEST_ID)

const openOptions = async (user: UserEvent, testId: string): Promise<string[]> => {
  await user.click(getComboBoxInput(testId))

  const options = await screen.findAllByRole('option')

  return options.map((option) => option.textContent ?? '')
}

const pickOption = async (user: UserEvent, testId: string, label: string): Promise<void> => {
  await user.click(getComboBoxInput(testId))

  const options = await screen.findAllByRole('option')

  await user.click(options.find((option) => option.textContent === label) as HTMLElement)
}

const pickRole = (user: UserEvent, label = 'Engineering'): Promise<void> =>
  pickOption(user, SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID, label)

const pickSource = (user: UserEvent, label: string): Promise<void> =>
  pickOption(user, SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID, label)

const replaceName = async (user: UserEvent, name: string): Promise<void> => {
  await user.clear(getNameInput())

  if (name) {
    await user.click(getNameInput())
    await user.paste(name)
  }
}

const submitValidForm = async (user: UserEvent): Promise<void> => {
  renderForm()

  await pickRole(user)
  await user.click(getSubmitButton())
}

describe('CreateOrganizationForm', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCreateSelfServeOrganizationMutation.mockReturnValue([mockCreateOrganization])
    mockCreateOrganization.mockResolvedValue(SUCCESS_RESULT)
    mockOnUserNotEligible.mockResolvedValue(undefined)
  })

  describe('GIVEN the form is rendered', () => {
    describe('WHEN the mutation is set up', () => {
      it('THEN should keep its errors away from the global toast layer', () => {
        renderForm()

        expect(mockUseCreateSelfServeOrganizationMutation).toHaveBeenCalledWith({
          context: { silentError: true },
        })
      })
    })

    describe('WHEN the user has an email', () => {
      it('THEN should prefill the name from the email domain', () => {
        renderForm()

        expect(getNameInput()).toHaveValue(PREFILLED_NAME)
      })
    })

    describe('WHEN the user has no email', () => {
      it('THEN should leave the name empty', () => {
        renderForm({ email: undefined })

        expect(getNameInput()).toHaveValue('')
      })
    })

    describe('WHEN opening the comboboxes', () => {
      it.each([
        ['role', SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID, ROLE_LABELS],
        ['source', SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID, SOURCE_LABELS],
      ])('THEN should list the %s options in order', async (_, testId, expectedLabels) => {
        const user = userEvent.setup()

        renderForm()

        expect(await openOptions(user, testId)).toEqual(expectedLabels)
      })

      it.each([
        ['role', SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID],
        ['source', SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID],
      ])('THEN should start with an empty %s', (_, testId) => {
        renderForm()

        expect(getComboBoxInput(testId)).toHaveValue('')
      })

      it.each([
        ['role', SELF_SERVE_CREATE_ORGANIZATION_ROLE_FIELD_TEST_ID, ROLE_PLACEHOLDER_COPY],
        ['source', SELF_SERVE_CREATE_ORGANIZATION_SOURCE_FIELD_TEST_ID, SOURCE_PLACEHOLDER_COPY],
      ])('THEN should show the %s placeholder', (_, testId, expectedPlaceholder) => {
        renderForm()

        expect(getComboBoxInput(testId)).toHaveAttribute('placeholder', expectedPlaceholder)
      })
    })
  })

  describe('GIVEN the submit button', () => {
    describe('WHEN the role is empty', () => {
      it('THEN should be disabled although the name is prefilled', () => {
        renderForm()

        expect(getNameInput()).toHaveValue(PREFILLED_NAME)
        expect(getSubmitButton()).toBeDisabled()
      })
    })

    describe('WHEN the name and role are filled', () => {
      it('THEN should be enabled', async () => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user)

        expect(getSubmitButton()).toBeEnabled()
      })
    })

    describe('WHEN the role is filled but the name is blank', () => {
      it.each([
        ['empty', ''],
        ['whitespace only', '   '],
      ])('THEN should be disabled for a %s name', async (_, name) => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user)
        await replaceName(user, name)

        expect(getSubmitButton()).toBeDisabled()
      })
    })

    describe('WHEN the mutation is running', () => {
      it('THEN should be disabled until it settles', async () => {
        let resolveMutation: (result: MutationResult) => void = () => undefined

        mockCreateOrganization.mockReturnValue(
          new Promise((resolve) => {
            resolveMutation = resolve
          }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)

        await waitFor(() => {
          expect(getSubmitButton()).toBeDisabled()
        })

        resolveMutation(SUCCESS_RESULT)

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalled()
        })
      })
    })
  })

  describe('GIVEN the user submits', () => {
    describe('WHEN only the name and role are filled', () => {
      it('THEN should send the trimmed name, the role and no source', async () => {
        const user = userEvent.setup()

        renderForm()

        await replaceName(user, '  Pied Piper  ')
        await pickRole(user, 'Product Management')
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockCreateOrganization).toHaveBeenCalledTimes(1)
        })
        expect(mockCreateOrganization).toHaveBeenCalledWith({
          variables: {
            input: {
              name: 'Pied Piper',
              role: SignupRoleEnum.ProductManagement,
              source: undefined,
            },
          },
        })
      })
    })

    describe('WHEN a role is selected', () => {
      it.each([
        ['Engineering', SignupRoleEnum.Engineering],
        ['Data', SignupRoleEnum.Data],
        ['Other', SignupRoleEnum.Other],
      ])('THEN should send the %s role value', async (label, expectedRole) => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user, label)
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockCreateOrganization).toHaveBeenCalledWith({
            variables: {
              input: { name: PREFILLED_NAME, role: expectedRole, source: undefined },
            },
          })
        })
      })
    })

    describe('WHEN a source is selected', () => {
      it.each([
        ['AI Search (Claude, ChatGPT, etc.)', SignupSourceEnum.AiSearch],
        ['Y Combinator', SignupSourceEnum.YCombinator],
        ['Other', SignupSourceEnum.Other],
      ])('THEN should send the %s source value', async (label, expectedSource) => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user)
        await pickSource(user, label)
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockCreateOrganization).toHaveBeenCalledWith({
            variables: {
              input: {
                name: PREFILLED_NAME,
                role: SignupRoleEnum.Engineering,
                source: expectedSource,
              },
            },
          })
        })
      })
    })

    describe('WHEN the creation succeeds', () => {
      it('THEN should land in the landing organization, replacing the history entry', async () => {
        const user = userEvent.setup()

        await submitValidForm(user)

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(`/${LANDING_SLUG}`, {
            replace: true,
            skipSlugPrepend: true,
          })
        })
        expect(mockOnUserNotEligible).not.toHaveBeenCalled()
        expect(
          screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the name is longer than 100 characters', () => {
      it('THEN should show the too long message without calling the API', async () => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user)
        await replaceName(user, 'a'.repeat(101))
        await user.click(getSubmitButton())

        expect(await screen.findByText(NAME_TOO_LONG_COPY)).toBeInTheDocument()
        expect(getNameInput()).toHaveAttribute('aria-invalid', 'true')
        expect(scrollToFirstInputError).toHaveBeenCalledTimes(1)
        expect(mockCreateOrganization).not.toHaveBeenCalled()
      })

      it('THEN should show the required message once the name is cleared', async () => {
        const user = userEvent.setup()

        renderForm()

        await pickRole(user)
        await replaceName(user, 'a'.repeat(101))
        await user.click(getSubmitButton())
        await screen.findByText(NAME_TOO_LONG_COPY)
        await user.clear(getNameInput())

        expect(await screen.findByText(NAME_REQUIRED_COPY)).toBeInTheDocument()
        expect(screen.queryByText(NAME_TOO_LONG_COPY)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the API refuses the name', () => {
    describe('WHEN the error holds a name detail code', () => {
      it.each([
        ['value_is_mandatory', NAME_REQUIRED_COPY],
        ['value_is_too_long', NAME_TOO_LONG_COPY],
        ['value_contains_link', NAME_CONTAINS_LINK_COPY],
      ])('THEN should show the %s message under the name', async (code, expectedCopy) => {
        mockCreateOrganization.mockResolvedValue(
          buildError({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { name: [code] },
          }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(await screen.findByText(expectedCopy)).toBeInTheDocument()
        expect(getNameInput()).toHaveAttribute('aria-invalid', 'true')
        expect(
          screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the name detail holds an unknown code before a known one', () => {
      it('THEN should show the first known message', async () => {
        mockCreateOrganization.mockResolvedValue(
          buildError({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { name: ['value_is_weird', 'value_contains_link'] },
          }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(await screen.findByText(NAME_CONTAINS_LINK_COPY)).toBeInTheDocument()
      })
    })

    describe('WHEN the user edits the name after the link error', () => {
      it('THEN should clear the error and allow submitting again', async () => {
        mockCreateOrganization.mockResolvedValueOnce(
          buildError({
            status: 422,
            code: LagoApiError.UnprocessableEntity,
            details: { name: ['value_contains_link'] },
          }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)
        await screen.findByText(NAME_CONTAINS_LINK_COPY)
        await replaceName(user, 'Pied Piper')

        await waitFor(() => {
          expect(screen.queryByText(NAME_CONTAINS_LINK_COPY)).not.toBeInTheDocument()
        })
        expect(getSubmitButton()).toBeEnabled()
      })
    })

    describe('WHEN the 422 carries no known name code', () => {
      it.each([
        ['an unknown name code', { name: ['value_is_weird'] }],
        ['a non-array name detail', { name: 'value_contains_link' }],
        ['details on another field', { role: ['value_is_invalid'] }],
        ['no details', undefined],
      ])('THEN should show the generic banner for %s', async (_, details) => {
        mockCreateOrganization.mockResolvedValue(
          buildError({ status: 422, code: LagoApiError.UnprocessableEntity, details }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(
          await screen.findByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).toHaveTextContent(GENERIC_ERROR_COPY)
        expect(getNameInput()).toHaveAttribute('aria-invalid', 'false')
      })
    })
  })

  describe('GIVEN the user is not eligible', () => {
    describe('WHEN the API answers user_not_eligible', () => {
      it('THEN should hand over to the page without showing an error', async () => {
        mockCreateOrganization.mockResolvedValue(
          buildError({ status: 405, code: LagoApiError.UserNotEligible }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)

        await waitFor(() => {
          expect(mockOnUserNotEligible).toHaveBeenCalledTimes(1)
        })
        expect(
          screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the API fails for another reason', () => {
    describe('WHEN the error is shown in the banner', () => {
      it.each([
        [LagoApiError.SelfServeDisabled, 403, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.SignupDisabled, 403, SIGN_UP_UNAVAILABLE_COPY],
        [LagoApiError.TooManyRequests, 429, TOO_MANY_ATTEMPTS_COPY],
        [LagoApiError.InternalError, 500, GENERIC_ERROR_COPY],
      ])('THEN should show the %s message', async (code, status, expectedCopy) => {
        mockCreateOrganization.mockResolvedValue(buildError({ status, code }))

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(
          await screen.findByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).toHaveTextContent(expectedCopy)
        expect(mockNavigate).not.toHaveBeenCalled()
        expect(mockOnUserNotEligible).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the answer has neither data nor errors', () => {
      it('THEN should show the generic message in the banner', async () => {
        mockCreateOrganization.mockResolvedValue({ data: null })

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(
          await screen.findByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).toHaveTextContent(GENERIC_ERROR_COPY)
      })
    })

    describe('WHEN the request fails on the network', () => {
      it('THEN should show the generic message in the banner', async () => {
        mockCreateOrganization.mockRejectedValue(new Error('Failed to fetch'))

        const user = userEvent.setup()

        await submitValidForm(user)

        expect(
          await screen.findByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).toHaveTextContent(GENERIC_ERROR_COPY)
      })
    })

    describe('WHEN the user submits again after a banner error', () => {
      it('THEN should clear the banner and land in the organization', async () => {
        mockCreateOrganization.mockResolvedValueOnce(
          buildError({ status: 403, code: LagoApiError.SelfServeDisabled }),
        )

        const user = userEvent.setup()

        await submitValidForm(user)
        await screen.findByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID)
        await user.click(getSubmitButton())

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(`/${LANDING_SLUG}`, {
            replace: true,
            skipSlugPrepend: true,
          })
        })
        expect(
          screen.queryByTestId(SELF_SERVE_CREATE_ORGANIZATION_ERROR_ALERT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
