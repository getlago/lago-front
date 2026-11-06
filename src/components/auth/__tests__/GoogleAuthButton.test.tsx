import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLFormattedError } from 'graphql'
import { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router'

import { initializeTranslations } from '~/core/apolloClient'
import { GetGoogleAuthUrlQuery, LagoApiError } from '~/generated/graphql'

import GoogleAuthButton from '../GoogleAuthButton'
import { takeGoogleOauthFlow } from '../googleOauthFlow'

type GoogleAuthButtonProps = ComponentProps<typeof GoogleAuthButton>
type GoogleAuthUrlAnswer = { data?: GetGoogleAuthUrlQuery; errors?: GraphQLFormattedError[] }

const mockGetGoogleUrl = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetGoogleAuthUrlLazyQuery: () => [mockGetGoogleUrl],
}))

const BUTTON_LABEL = 'Continue with Google'
const STATE_SECRET = 'state-secret-1'
const INVITATION_TOKEN = 'invitation-token-1'
const PREVIOUS_PATH = '/customers/123'
const SIGNED_GOOGLE_URL =
  'https://accounts.google.com/o/oauth2/v2/auth?client_id=client-1&state=1793952050.abcdef0123456789'
const LEGACY_GOOGLE_URL = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=client-1'

const GENERIC_ERROR_COPY = 'An error occurred, please try again'
const MISSING_SETUP_COPY = /^Sorry, Google Connect is not configured in your environment variables/

const buildAuthUrlAnswer = (stateSecret: string | null, url: string): GoogleAuthUrlAnswer => ({
  data: { googleAuthUrl: { url, stateSecret } },
})

const spyOnLocationHref = (): jest.SpyInstance => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find(
    (symbol) => symbol.description === 'impl',
  ) as symbol
  const locationImpl = (window.location as unknown as Record<symbol, Location>)[implSymbol]

  return jest.spyOn(locationImpl, 'href', 'set').mockImplementation(() => undefined)
}

const renderButton = ({
  props = {},
  search = '',
  previousPath,
}: {
  props?: Partial<GoogleAuthButtonProps>
  search?: string
  previousPath?: string
} = {}): void => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/login',
          search,
          state: previousPath ? { from: { pathname: previousPath } } : null,
        },
      ]}
    >
      <GoogleAuthButton mode="login" label={BUTTON_LABEL} {...props} />
    </MemoryRouter>,
  )
}

const clickButton = async (): Promise<void> => {
  await userEvent.setup().click(screen.getByRole('button', { name: BUTTON_LABEL }))
}

describe('GoogleAuthButton', () => {
  let hrefSpy: jest.SpyInstance

  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    mockGetGoogleUrl.mockReset()
    sessionStorage.clear()
    hrefSpy = spyOnLocationHref()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the API returns a state secret with the Google URL', () => {
    beforeEach(() => {
      mockGetGoogleUrl.mockResolvedValue(buildAuthUrlAnswer(STATE_SECRET, SIGNED_GOOGLE_URL))
    })

    describe('WHEN clicking the button on the login page opened from a protected page', () => {
      it('THEN should go to the Google URL unchanged', async () => {
        renderButton({ previousPath: PREVIOUS_PATH })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalledWith(SIGNED_GOOGLE_URL)
        })
        expect(hrefSpy).toHaveBeenCalledTimes(1)
      })

      it('THEN should keep the state secret, the mode and the redirect path for this tab', async () => {
        renderButton({ previousPath: PREVIOUS_PATH })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalled()
        })
        expect(takeGoogleOauthFlow()).toEqual({
          stateSecret: STATE_SECRET,
          mode: 'login',
          redirectPath: PREVIOUS_PATH,
        })
      })
    })

    describe('WHEN clicking the button of an invitation', () => {
      it('THEN should keep the invitation token with the flow', async () => {
        renderButton({ props: { mode: 'invite', invitationToken: INVITATION_TOKEN } })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalledWith(SIGNED_GOOGLE_URL)
        })
        expect(takeGoogleOauthFlow()).toEqual({
          stateSecret: STATE_SECRET,
          mode: 'invite',
          invitationToken: INVITATION_TOKEN,
        })
      })
    })

    describe('WHEN clicking the sign-up button', () => {
      it('THEN should keep a sign-up flow', async () => {
        renderButton({ props: { mode: 'signup' } })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalledWith(SIGNED_GOOGLE_URL)
        })
        expect(takeGoogleOauthFlow()).toEqual({ stateSecret: STATE_SECRET, mode: 'signup' })
      })
    })
  })

  describe('GIVEN the API returns no state secret', () => {
    beforeEach(() => {
      mockGetGoogleUrl.mockResolvedValue(buildAuthUrlAnswer(null, LEGACY_GOOGLE_URL))
    })

    describe('WHEN clicking the button of an invitation opened from a protected page', () => {
      it('THEN should add the mode, the redirect path and the invitation token to the state', async () => {
        renderButton({
          props: { mode: 'invite', invitationToken: INVITATION_TOKEN },
          previousPath: PREVIOUS_PATH,
        })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalledTimes(1)
        })

        const target = new URL(hrefSpy.mock.calls[0][0])

        expect(`${target.origin}${target.pathname}`).toBe(
          'https://accounts.google.com/o/oauth2/v2/auth',
        )
        expect(target.searchParams.get('client_id')).toBe('client-1')
        expect(JSON.parse(target.searchParams.get('state') || '')).toEqual({
          mode: 'invite',
          redirectPath: PREVIOUS_PATH,
          invitationToken: INVITATION_TOKEN,
        })
      })

      it('THEN should not keep any flow in the tab', async () => {
        renderButton({ props: { mode: 'invite', invitationToken: INVITATION_TOKEN } })

        await clickButton()

        await waitFor(() => {
          expect(hrefSpy).toHaveBeenCalled()
        })
        expect(takeGoogleOauthFlow()).toBeUndefined()
      })
    })
  })

  describe('GIVEN Google is not configured on the API', () => {
    beforeEach(() => {
      mockGetGoogleUrl.mockResolvedValue({
        errors: [
          {
            message: 'error',
            extensions: { status: 500, code: LagoApiError.GoogleAuthMissingSetup },
          },
        ],
      })
    })

    describe('WHEN clicking the button', () => {
      it('THEN should show the setup error without leaving the page', async () => {
        renderButton()

        await clickButton()

        expect(await screen.findByText(MISSING_SETUP_COPY)).toBeInTheDocument()
        expect(hrefSpy).not.toHaveBeenCalled()
        expect(takeGoogleOauthFlow()).toBeUndefined()
      })
    })
  })

  describe('GIVEN the callback sent back an invalid Google state', () => {
    const search = `?lago_error_code=${LagoApiError.InvalidGoogleState}`

    describe('WHEN the button shows its alert', () => {
      it('THEN should show the generic Google error', () => {
        renderButton({ search })

        expect(screen.getByText(GENERIC_ERROR_COPY)).toBeInTheDocument()
      })
    })

    describe('WHEN the alert is hidden', () => {
      it('THEN should not show the error', () => {
        renderButton({ search, props: { hideAlert: true } })

        expect(screen.queryByText(GENERIC_ERROR_COPY)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the callback sent back a code the button does not handle', () => {
    describe('WHEN the button is rendered', () => {
      it('THEN should not show any error', () => {
        renderButton({ search: `?lago_error_code=${LagoApiError.CompanyGoogleAccountRequired}` })

        expect(screen.queryByText(GENERIC_ERROR_COPY)).not.toBeInTheDocument()
      })
    })
  })
})
