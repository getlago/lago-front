import { act, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { setItemFromLS } from '~/core/utils/localStorage'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/utils/localStorageKeys'

// Import after mocks
import LoginEntraId from '../LoginEntraId'

configure({ testIdAttribute: 'data-test' })

const mockSetItemFromLS = setItemFromLS as jest.Mock
const mockFetchEntraIdAuthorizeUrl = jest.fn()
const mockUseLocation = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockUseLocation(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/ui/useShortcuts', () => ({
  useShortcuts: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  hasDefinedGQLError: jest.fn(),
}))

jest.mock('~/core/utils/localStorage', () => ({
  ...jest.requireActual('~/core/utils/localStorage'),
  setItemFromLS: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useFetchEntraIdAuthorizeUrlMutation: () => [
    mockFetchEntraIdAuthorizeUrl,
    { error: undefined, loading: false },
  ],
}))

jest.mock('~/core/utils/urlUtils', () => ({
  addValuesToUrlState: () => 'https://login.microsoftonline.com/authorize',
}))

describe('LoginEntraId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the user was redirected from a protected page', () => {
    const protectedPath = '/customers/789/information'

    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        state: {
          from: { pathname: protectedPath, search: '', hash: '', state: null, key: 'test' },
        },
        pathname: '/auth/entra',
        search: '',
        hash: '',
        key: 'default',
      })
    })

    describe('WHEN the form is submitted and Entra ID returns an authorize URL', () => {
      it('THEN should store the redirect path in localStorage', async () => {
        mockFetchEntraIdAuthorizeUrl.mockResolvedValue({
          data: {
            entraIdAuthorize: { url: 'https://login.microsoftonline.com/authorize?state=test' },
          },
        })

        const user = userEvent.setup()

        await act(async () => {
          render(
            <MemoryRouter>
              <LoginEntraId />
            </MemoryRouter>,
          )
        })

        const emailInput = screen.getByTestId('submit').closest('form')
          ? (document.querySelector('input[name="email"]') as HTMLInputElement)
          : (document.querySelector('input') as HTMLInputElement)

        await user.type(emailInput, 'user@example.com')

        const submitButton = screen.getByTestId('submit')

        await user.click(submitButton)

        await waitFor(() => {
          expect(mockFetchEntraIdAuthorizeUrl).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: { input: { email: 'user@example.com' } },
            }),
          )
        })

        await waitFor(() => {
          expect(mockSetItemFromLS).toHaveBeenCalledWith(REDIRECT_AFTER_LOGIN_LS_KEY, protectedPath)
        })
      })
    })
  })

  describe('GIVEN the user navigated directly to the Entra ID login page', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        state: null,
        pathname: '/auth/entra',
        search: '',
        hash: '',
        key: 'default',
      })
    })

    describe('WHEN the form is submitted and Entra ID returns an authorize URL', () => {
      it('THEN should not store anything in localStorage', async () => {
        mockFetchEntraIdAuthorizeUrl.mockResolvedValue({
          data: {
            entraIdAuthorize: { url: 'https://login.microsoftonline.com/authorize?state=test' },
          },
        })

        const user = userEvent.setup()

        await act(async () => {
          render(
            <MemoryRouter>
              <LoginEntraId />
            </MemoryRouter>,
          )
        })

        const emailInput = document.querySelector('input') as HTMLInputElement

        await user.type(emailInput, 'user@example.com')

        const submitButton = screen.getByTestId('submit')

        await user.click(submitButton)

        await waitFor(() => {
          expect(mockFetchEntraIdAuthorizeUrl).toHaveBeenCalled()
        })

        expect(mockSetItemFromLS).not.toHaveBeenCalledWith(
          REDIRECT_AFTER_LOGIN_LS_KEY,
          expect.anything(),
        )
      })
    })
  })
})
