import { MockedProvider } from '@apollo/client/testing'
import { act, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Login from '../Login'

const getByDataTest = (testId: string) => document.querySelector(`[data-test="${testId}"]`)

const mockNavigate = jest.fn()
const mockClosePanel = jest.fn()
const mockHasDefinedGQLError = jest.fn()
const mockLoginUser = jest.fn()
const mockOnLogIn = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
  }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  ...jest.requireActual('~/hooks/useDeveloperTool'),
  useDeveloperTool: () => ({ closePanel: mockClosePanel }),
  resetDevtoolsNavigation: jest.fn(),
}))

jest.mock('~/components/auth/GoogleAuthButton', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => (
    <button data-test="google-auth-button">{label}</button>
  ),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
  onLogIn: (...args: unknown[]) => mockOnLogIn(...args),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useLoginUserMutation: (options: { onCompleted?: (res: unknown) => void }) => {
    mockLoginUser.mockImplementation(async () => {
      const res = { data: { loginUser: { token: 'token' } } }

      await options?.onCompleted?.(res.data)

      return res
    })

    return [mockLoginUser, { error: undefined }]
  },
}))

const renderLogin = async (initialEntries: string[] = ['/login']) => {
  let result

  await act(async () => {
    result = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={initialEntries}>
          <Login />
        </MemoryRouter>
      </MockedProvider>,
    )
  })

  return result
}

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasDefinedGQLError.mockReturnValue(false)
  })

  describe('GIVEN the form is rendered', () => {
    it('THEN should display the email and password fields and the submit button', async () => {
      await renderLogin()

      expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      expect(document.querySelector('input[name="password"]')).toBeInTheDocument()
      expect(getByDataTest('submit')).toBeInTheDocument()
    })

    it('THEN should not display the incorrect login alert', async () => {
      await renderLogin()

      expect(getByDataTest('incorrect-login-or-password-alert')).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the user submits the form with empty fields', () => {
    it('THEN should display a required error for both fields', async () => {
      const user = userEvent.setup()

      await renderLogin()

      await act(async () => {
        await user.click(getByDataTest('submit') as HTMLButtonElement)
      })

      await waitFor(() => {
        expect(document.querySelectorAll('[data-test="text-field-error"]')).toHaveLength(2)
      })

      expect(mockLoginUser).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the user submits the form with valid credentials', () => {
    it('THEN should call the login mutation with the entered values', async () => {
      const user = userEvent.setup()

      await renderLogin()

      await user.type(
        document.querySelector('input[name="email"]') as HTMLInputElement,
        'foo@bar.com',
      )
      await user.type(
        document.querySelector('input[name="password"]') as HTMLInputElement,
        'password',
      )

      await act(async () => {
        await user.click(getByDataTest('submit') as HTMLButtonElement)
      })

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { input: { email: 'foo@bar.com', password: 'password' } },
          }),
        )
      })
    })

    it('THEN should submit when pressing Enter in the password field', async () => {
      const user = userEvent.setup()

      await renderLogin()

      await user.type(
        document.querySelector('input[name="email"]') as HTMLInputElement,
        'foo@bar.com',
      )

      const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement

      await user.type(passwordInput, 'password')

      await act(async () => {
        await user.type(passwordInput, '{Enter}')
      })

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the login mutation returns an incorrect login or password error', () => {
    it('THEN should display the incorrect login or password alert', async () => {
      mockHasDefinedGQLError.mockImplementation(
        (code: string) => code === 'IncorrectLoginOrPassword',
      )

      await renderLogin()

      expect(getByDataTest('incorrect-login-or-password-alert')).toBeInTheDocument()
    })
  })

  describe('GIVEN the user was redirected with an okta auth method error', () => {
    it('THEN should display the login method not authorized alert', async () => {
      await renderLogin(['/login?lago_error_code=okta_login_method_not_authorized'])

      expect(getByDataTest('login-method-not-authorized-alert')).toBeInTheDocument()
    })
  })

  describe('GIVEN the user clicks on the Okta login button', () => {
    it('THEN should navigate to the Okta login route', async () => {
      const user = userEvent.setup()

      await renderLogin()

      const oktaButton = document.querySelectorAll('button')

      const oktaLoginButton = Array.from(oktaButton).find((button) =>
        button.textContent?.includes('text_664c90c9b2b6c2012aa50bce'),
      ) as HTMLButtonElement

      await user.click(oktaLoginButton)

      expect(mockNavigate).toHaveBeenCalledWith('/login/okta', { state: null })
    })
  })
})
