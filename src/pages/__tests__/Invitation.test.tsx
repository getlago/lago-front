import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { PASSWORD_HINTS_TEST_IDS } from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import {
  AcceptInviteDocument,
  EntraIdAcceptInviteDocument,
  GetinviteDocument,
  JoinOrganizationDocument,
  LagoApiError,
  OktaAcceptInviteDocument,
} from '~/generated/graphql'

import Invitation, {
  INVITATION_JOIN_BUTTON_TEST_ID,
  INVITATION_LOG_IN_BUTTON_TEST_ID,
  INVITATION_LOG_OUT_BUTTON_TEST_ID,
  INVITATION_SUBMIT_BUTTON_TEST_ID,
} from '../Invitation'

const getByDataTest = (testId: string) => document.querySelector(`[data-test="${testId}"]`)

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockIsAuthenticated = jest.fn()

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => mockIsAuthenticated(),
}))

const mockCurrentUser = jest.fn()
const mockRefetchCurrentUserInfos = jest.fn()

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockCurrentUser(),
}))

const mockOnLogIn = jest.fn()
const mockLogOut = jest.fn()
const mockNavigate = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
  logOut: (...args: unknown[]) => mockLogOut(...args),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/components/auth/GoogleAuthButton', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => (
    <button data-testid="google-auth-button">{label}</button>
  ),
}))

const mockPasswordValidation = jest.fn()

jest.mock('~/hooks/forms/usePasswordValidation', () => ({
  usePasswordValidation: (password: string) => mockPasswordValidation(password),
}))

const mockHandleSubmit = jest.fn()
let mockFormPassword = ''

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: ({
    onSubmit,
  }: {
    onSubmit: (args: { value: { password: string } }) => Promise<void>
  }) => ({
    store: {
      subscribe: jest.fn(() => jest.fn()),
      getState: () => ({
        values: { password: '' },
        canSubmit: true,
      }),
    },
    handleSubmit: async () => {
      mockHandleSubmit()
      await onSubmit({ value: { password: mockFormPassword } }).catch(() => undefined)
    },
    AppField: ({
      name,
      children,
    }: {
      name: string
      children: (field: unknown) => React.ReactNode
    }) => {
      const testIdMap: Record<string, string> = {
        password: 'invitation-password-field',
      }

      const fieldProps = {
        TextInputField: ({
          label,
          password,
        }: {
          label?: string
          placeholder?: string
          password?: boolean
          showOnlyErrors?: string[]
        }) => (
          <div>
            {label && <label>{label}</label>}
            <input type={password ? 'password' : 'text'} data-test={testIdMap[name]} />
          </div>
        ),
      }

      return <>{children(fieldProps)}</>
    },
    AppForm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SubmitButton: ({
      children,
      dataTest,
      loading,
    }: {
      children: React.ReactNode
      dataTest?: string
      loading?: boolean
    }) => (
      <button type="submit" data-test={dataTest} disabled={loading}>
        {children}
      </button>
    ),
  }),
}))

const mockUseStore = jest.fn()

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: jest.fn(() => ({})),
  useStore: (...args: unknown[]) => mockUseStore(...args),
}))

const setupMockUseStore = (password = '', canSubmit = true) => {
  mockFormPassword = password
  mockUseStore.mockImplementation((_store, selector) => {
    const state = {
      canSubmit,
      values: { password },
    }

    return selector(state)
  })
}

type LagoApiErrorCode = keyof typeof LagoApiError

const graphQLError = (code: LagoApiErrorCode) =>
  new GraphQLError(code, {
    extensions: { code: LagoApiError[code] },
  })

const createInviteMock = (
  overrides: {
    token?: string
    email?: string
    organizationName?: string
    organizationSlug?: string
    existingUser?: boolean
    error?: boolean
    onResult?: () => void
  } = {},
): MockedResponse => {
  const {
    token = 'test-token',
    email = 'test@example.com',
    organizationName = 'Test Org',
    organizationSlug = 'test-org',
    existingUser = false,
    error = false,
    onResult,
  } = overrides

  if (error) {
    return {
      request: {
        query: GetinviteDocument,
        variables: { token },
      },
      error: new Error('Invite not found'),
    }
  }

  const result = {
    data: {
      invite: {
        id: 'invite-1',
        email,
        existingUser,
        organization: {
          id: 'org-1',
          name: organizationName,
          slug: organizationSlug,
        },
      },
    },
  }

  return {
    request: {
      query: GetinviteDocument,
      variables: { token },
    },
    result: onResult
      ? () => {
          onResult()

          return result
        }
      : result,
  }
}

const createJoinOrganizationMock = (
  overrides: { token?: string; slug?: string; errorCode?: LagoApiErrorCode } = {},
): MockedResponse => {
  const { token = 'test-token', slug = 'test-org', errorCode } = overrides

  return {
    request: {
      query: JoinOrganizationDocument,
      variables: { input: { token } },
    },
    result: errorCode
      ? { errors: [graphQLError(errorCode)] }
      : {
          data: {
            joinOrganization: {
              id: 'membership-1',
              organization: {
                id: 'org-1',
                slug,
              },
            },
          },
        },
  }
}

const createOktaAcceptInviteMock = (): MockedResponse => ({
  request: {
    query: OktaAcceptInviteDocument,
    variables: {
      input: {
        code: 'okta-code',
        state: 'okta-state',
        inviteToken: 'test-token',
      },
    },
  },
  result: { data: { oktaAcceptInvite: { token: 'user-token' } } },
})

const createEntraIdAcceptInviteMock = (): MockedResponse => ({
  request: {
    query: EntraIdAcceptInviteDocument,
    variables: {
      input: {
        code: 'entra-code',
        state: 'entra-state',
        inviteToken: 'test-token',
      },
    },
  },
  result: { data: { entraIdAcceptInvite: { token: 'user-token' } } },
})

const createAcceptInviteMock = (
  overrides: {
    token?: string
    userToken?: string
    slug?: string
    errorCode?: LagoApiErrorCode
  } = {},
): MockedResponse => {
  const { token = 'test-token', userToken = 'user-token', slug = 'test-org', errorCode } = overrides

  return {
    request: {
      query: AcceptInviteDocument,
      variables: { input: { token, password: mockFormPassword } },
    },
    result: errorCode
      ? { errors: [graphQLError(errorCode)] }
      : {
          data: {
            acceptInvite: {
              token: userToken,
              organization: {
                id: 'org-1',
                slug,
              },
            },
          },
        },
  }
}

const renderInvitation = async (
  mocks: MockedResponse[] = [createInviteMock()],
  token = 'test-token',
  search = '',
) => {
  let result

  await act(async () => {
    result = render(
      <MockedProvider mocks={mocks}>
        <MemoryRouter initialEntries={[`/invitation/${token}${search}`]}>
          <Routes>
            <Route path="/invitation/:token" element={<Invitation />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>,
    )
  })

  return result
}

describe('Invitation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMockUseStore('', true)
    mockIsAuthenticated.mockReturnValue({ isAuthenticated: false })
    mockCurrentUser.mockReturnValue({
      currentUser: undefined,
      loading: false,
      refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
    })
    mockPasswordValidation.mockReturnValue({
      isValid: false,
      errors: ['MIN', 'LOWERCASE', 'UPPERCASE', 'NUMBER', 'SPECIAL'],
    })
    mockOnLogIn.mockResolvedValue(undefined)
    mockLogOut.mockResolvedValue(undefined)
    mockNavigate.mockReset()
  })

  describe('when invite is loaded successfully', () => {
    it('should display the organization name in the title', async () => {
      await renderInvitation([createInviteMock({ organizationName: 'Acme Corp' })])

      await waitFor(() => {
        expect(screen.getByText('text_664c90c9b2b6c2012aa50bcd')).toBeInTheDocument()
      })
    })

    it('should show Google auth button', async () => {
      await renderInvitation()

      await waitFor(() => {
        expect(screen.getByTestId('google-auth-button')).toBeInTheDocument()
      })
    })

    it('should show Okta button', async () => {
      await renderInvitation()

      await waitFor(() => {
        expect(screen.getByText('text_664c90c9b2b6c2012aa50bd5')).toBeInTheDocument()
      })
    })

    it('should show Entra ID button', async () => {
      await renderInvitation()

      await waitFor(() => {
        expect(screen.getByText('text_1784307344255ojifndnfotw')).toBeInTheDocument()
      })
    })

    it('should have submit button', async () => {
      await renderInvitation()

      await waitFor(() => {
        const submitButton = getByDataTest(INVITATION_SUBMIT_BUTTON_TEST_ID)

        expect(submitButton).toBeInTheDocument()
        expect(submitButton?.textContent).toBe('text_63246f875e2228ab7b63dd1c')
      })
    })

    it('should enter the invited organization after Okta authentication', async () => {
      await renderInvitation(
        [createInviteMock({ organizationSlug: 'invited-org' }), createOktaAcceptInviteMock()],
        'test-token',
        '?oktaCode=okta-code&oktaState=okta-state',
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/invited-org', {
          replace: true,
          skipSlugPrepend: true,
        })
      })
    })

    it('should enter the invited organization after Entra ID authentication', async () => {
      await renderInvitation(
        [createInviteMock({ organizationSlug: 'invited-org' }), createEntraIdAcceptInviteMock()],
        'test-token',
        '?entraIdCode=entra-code&entraIdState=entra-state',
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/invited-org', {
          replace: true,
          skipSlugPrepend: true,
        })
      })
    })
  })

  describe('when invite is not found', () => {
    it('should show error state with login button', async () => {
      const errorMock = createInviteMock({ error: true })

      await renderInvitation([errorMock])

      await waitFor(() => {
        expect(screen.getByText('text_63246f875e2228ab7b63dcf4')).toBeInTheDocument()
        expect(screen.getByText('text_620bc4d4269a55014d493f6d')).toBeInTheDocument()
      })
    })
  })

  describe('password validation', () => {
    it('should show hidden validation hints when password is empty', async () => {
      setupMockUseStore('', true)
      mockPasswordValidation.mockReturnValue({
        isValid: false,
        errors: ['MIN', 'LOWERCASE', 'UPPERCASE', 'NUMBER', 'SPECIAL'],
      })

      await renderInvitation()

      await waitFor(() => {
        expect(getByDataTest(PASSWORD_HINTS_TEST_IDS.HIDDEN)).toBeInTheDocument()
      })
    })

    it('should show visible validation hints when typing invalid password', async () => {
      setupMockUseStore('weak', true)
      mockPasswordValidation.mockReturnValue({
        isValid: false,
        errors: ['MIN', 'UPPERCASE', 'NUMBER', 'SPECIAL'],
      })

      await renderInvitation()

      await waitFor(() => {
        expect(getByDataTest(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
      })
    })

    it('should show success alert when password is valid', async () => {
      setupMockUseStore('ValidPass1!', true)
      mockPasswordValidation.mockReturnValue({ isValid: true, errors: [] })

      await renderInvitation()

      await waitFor(() => {
        expect(getByDataTest(PASSWORD_HINTS_TEST_IDS.SUCCESS)).toBeInTheDocument()
      })
    })
  })

  describe('email field', () => {
    it('should display email field as disabled', async () => {
      await renderInvitation()

      await waitFor(() => {
        const emailInput = document.querySelector('input[name="email"]')

        expect(emailInput).toBeInTheDocument()
        expect(emailInput).toBeDisabled()
      })
    })
  })

  describe('when the invited email already has an account', () => {
    const mocks = [createInviteMock({ existingUser: true })]

    it('should ask for the password of the existing account', async () => {
      await renderInvitation(mocks)

      await waitFor(() => {
        expect(getByDataTest(INVITATION_LOG_IN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(document.querySelector('input[name="email"]')).toBeDisabled()
      expect(getByDataTest(INVITATION_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    // The password is verified against the existing account, not created: applying the creation
    // rules would lock out any password predating them.
    it('should not show the password creation hints', async () => {
      setupMockUseStore('weak', true)
      mockPasswordValidation.mockReturnValue({
        isValid: false,
        errors: ['MIN', 'UPPERCASE', 'NUMBER', 'SPECIAL'],
      })

      await renderInvitation(mocks)

      await waitFor(() => {
        expect(getByDataTest(INVITATION_LOG_IN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(getByDataTest(PASSWORD_HINTS_TEST_IDS.VISIBLE)).not.toBeInTheDocument()
      expect(getByDataTest(PASSWORD_HINTS_TEST_IDS.HIDDEN)).not.toBeInTheDocument()
    })

    it('should keep the SSO buttons available', async () => {
      await renderInvitation(mocks)

      await waitFor(() => {
        expect(screen.getByTestId('google-auth-button')).toBeInTheDocument()
      })

      expect(screen.getByText('text_664c90c9b2b6c2012aa50bd5')).toBeInTheDocument()
    })

    it('should submit the existing account password and start its session', async () => {
      const user = userEvent.setup()

      setupMockUseStore('existing-password')
      await renderInvitation([createInviteMock({ existingUser: true }), createAcceptInviteMock()])

      await user.click(await screen.findByText('text_1786557508910towzrwnae9w'))

      await waitFor(() => {
        expect(mockOnLogIn).toHaveBeenCalledWith(expect.anything(), 'user-token')
      })
    })

    it('should display an error when the existing account password is incorrect', async () => {
      const user = userEvent.setup()

      setupMockUseStore('incorrect-password')
      await renderInvitation([
        createInviteMock({ existingUser: true }),
        createAcceptInviteMock({ errorCode: 'IncorrectLoginOrPassword' }),
      ])

      await user.click(await screen.findByText('text_1786557508910towzrwnae9w'))

      expect(await screen.findByText('text_620bc4d4269a55014d493fb7')).toBeInTheDocument()
    })
  })

  describe('when the invited email does not have an account', () => {
    it('should submit the new password and start the created session', async () => {
      const user = userEvent.setup()

      setupMockUseStore('ValidPassword1!')
      await renderInvitation([createInviteMock(), createAcceptInviteMock()])

      await user.click(await screen.findByText('text_63246f875e2228ab7b63dd1c'))

      await waitFor(() => {
        expect(mockOnLogIn).toHaveBeenCalledWith(expect.anything(), 'user-token')
      })
    })

    it('should explain when an account was created after the invitation was loaded', async () => {
      const user = userEvent.setup()

      setupMockUseStore('ValidPassword1!')
      await renderInvitation([
        createInviteMock(),
        createAcceptInviteMock({ errorCode: 'EmailAlreadyUsed' }),
      ])

      await user.click(await screen.findByText('text_63246f875e2228ab7b63dd1c'))

      expect(await screen.findByText('text_1786557508910guitmzid55q')).toBeInTheDocument()
    })
  })

  describe('when the invited user is authenticated', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue({ isAuthenticated: true })
      mockCurrentUser.mockReturnValue({
        currentUser: { id: 'user-1', email: 'test@example.com' },
        loading: false,
        refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
      })
    })

    it('should only offer to accept the invitation', async () => {
      await renderInvitation([createInviteMock({ existingUser: true })])

      await waitFor(() => {
        expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(getByDataTest(INVITATION_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId('google-auth-button')).not.toBeInTheDocument()
    })

    it('should not show the skeleton while memberships are reloading', async () => {
      mockCurrentUser.mockReturnValue({
        currentUser: { id: 'user-1', email: 'test@example.com' },
        loading: true,
        refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
      })

      await renderInvitation([createInviteMock({ existingUser: true })])

      await waitFor(() => {
        expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    it('should reload the memberships of the user after accepting', async () => {
      await renderInvitation([
        createInviteMock({ existingUser: true }),
        createJoinOrganizationMock(),
      ])

      await waitFor(() => {
        expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await act(async () => {
        ;(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID) as HTMLElement).click()
      })

      await waitFor(() => {
        expect(mockRefetchCurrentUserInfos).toHaveBeenCalled()
      })
    })

    it('should accept the invitation when the invited email only differs by its case', async () => {
      mockCurrentUser.mockReturnValue({
        currentUser: { id: 'user-1', email: 'TEST@example.com' },
        loading: false,
        refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
      })

      await renderInvitation([createInviteMock({ existingUser: true })])

      await waitFor(() => {
        expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(getByDataTest(INVITATION_LOG_OUT_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    it('should allow logging out when the session cannot accept the invitation', async () => {
      const user = userEvent.setup()

      await renderInvitation([
        createInviteMock({ existingUser: true }),
        createJoinOrganizationMock({ errorCode: 'LoginMethodNotAuthorized' }),
      ])

      await user.click(await screen.findByText('text_17865575089104r0enbn7r7l'))

      expect(await screen.findByText('text_1786557573982blvi6cjpnti')).toBeInTheDocument()
      expect(getByDataTest(INVITATION_LOG_OUT_BUTTON_TEST_ID)).toBeInTheDocument()
      expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('when another user is authenticated', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue({ isAuthenticated: true })
      mockCurrentUser.mockReturnValue({
        currentUser: { id: 'user-2', email: 'someone-else@example.com' },
        loading: false,
        refetchCurrentUserInfos: mockRefetchCurrentUserInfos,
      })
    })

    it('should offer to log out instead of accepting the invitation', async () => {
      await renderInvitation([createInviteMock({ existingUser: true })])

      await waitFor(() => {
        expect(getByDataTest(INVITATION_LOG_OUT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      expect(getByDataTest(INVITATION_JOIN_BUTTON_TEST_ID)).not.toBeInTheDocument()
      expect(getByDataTest(INVITATION_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })

    it('should log out and refetch the invitation', async () => {
      const user = userEvent.setup()
      const onInviteResult = jest.fn()
      const inviteMock = createInviteMock({ existingUser: true, onResult: onInviteResult })

      await renderInvitation([inviteMock, inviteMock])
      await user.click(await screen.findByText('text_17865575089106781wwdm3l3'))

      await waitFor(() => {
        expect(mockLogOut).toHaveBeenCalledWith(expect.anything(), true)
        expect(onInviteResult).toHaveBeenCalledTimes(2)
      })
    })
  })
})
