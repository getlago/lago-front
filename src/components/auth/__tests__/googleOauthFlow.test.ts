import {
  GoogleOauthFlow,
  parseLegacyGoogleState,
  storeGoogleOauthFlow,
  takeGoogleOauthFlow,
} from '../googleOauthFlow'

const GOOGLE_OAUTH_FLOW_KEY = 'googleOauthFlow'

const LOGIN_FLOW: GoogleOauthFlow = {
  stateSecret: 'state-secret-1',
  mode: 'login',
  redirectPath: '/customers/123',
}

const INVITE_FLOW: GoogleOauthFlow = {
  stateSecret: 'state-secret-2',
  mode: 'invite',
  invitationToken: 'invitation-token-1',
}

const SIGN_UP_FLOW: GoogleOauthFlow = {
  stateSecret: 'state-secret-3',
  mode: 'signup',
}

const storageError = (): never => {
  throw new DOMException('The operation is insecure.', 'SecurityError')
}

describe('googleOauthFlow', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN a flow was stored by the Google button', () => {
    describe('WHEN the callback takes it', () => {
      it.each([
        ['a login flow with a redirect path', LOGIN_FLOW],
        ['an invite flow with an invitation token', INVITE_FLOW],
        ['a sign-up flow without optional values', SIGN_UP_FLOW],
      ])('THEN should return %s', (_, flow) => {
        storeGoogleOauthFlow(flow)

        expect(takeGoogleOauthFlow()).toEqual(flow)
      })

      it('THEN should return it only once', () => {
        storeGoogleOauthFlow(LOGIN_FLOW)

        takeGoogleOauthFlow()

        expect(takeGoogleOauthFlow()).toBeUndefined()
        expect(sessionStorage.getItem(GOOGLE_OAUTH_FLOW_KEY)).toBeNull()
      })
    })

    describe('WHEN another flow is stored afterwards', () => {
      it('THEN should return the last stored flow', () => {
        storeGoogleOauthFlow(LOGIN_FLOW)
        storeGoogleOauthFlow(INVITE_FLOW)

        expect(takeGoogleOauthFlow()).toEqual(INVITE_FLOW)
      })
    })
  })

  describe('GIVEN nothing was stored', () => {
    describe('WHEN the callback takes the flow', () => {
      it('THEN should return undefined', () => {
        expect(takeGoogleOauthFlow()).toBeUndefined()
      })
    })
  })

  describe('GIVEN the stored entry is not a valid flow', () => {
    describe('WHEN the callback takes the flow', () => {
      it.each([
        ['malformed JSON', '{"stateSecret":'],
        ['a JSON null', 'null'],
        ['a missing state secret', JSON.stringify({ mode: 'signup' })],
        ['a state secret that is not a string', JSON.stringify({ stateSecret: 42, mode: 'login' })],
        ['an unknown mode', JSON.stringify({ stateSecret: 'secret', mode: 'register' })],
        ['a missing mode', JSON.stringify({ stateSecret: 'secret' })],
        [
          'an invitation token that is not a string',
          JSON.stringify({ stateSecret: 'secret', mode: 'invite', invitationToken: 1 }),
        ],
      ])('THEN should return undefined for %s and remove the entry', (_, storedValue) => {
        sessionStorage.setItem(GOOGLE_OAUTH_FLOW_KEY, storedValue)

        expect(takeGoogleOauthFlow()).toBeUndefined()
        expect(sessionStorage.getItem(GOOGLE_OAUTH_FLOW_KEY)).toBeNull()
      })
    })
  })

  describe('GIVEN the session storage is unavailable', () => {
    describe('WHEN storing a flow', () => {
      it('THEN should not throw', () => {
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(storageError)

        expect(() => storeGoogleOauthFlow(LOGIN_FLOW)).not.toThrow()
      })
    })

    describe('WHEN taking the flow', () => {
      it('THEN should return undefined without throwing', () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(storageError)

        expect(takeGoogleOauthFlow()).toBeUndefined()
      })
    })
  })
})

describe('parseLegacyGoogleState', () => {
  describe('GIVEN the plain JSON state the Google button writes without a state secret', () => {
    it('THEN should return its mode, invitation token and redirect path', () => {
      expect(
        parseLegacyGoogleState(
          JSON.stringify({ mode: 'invite', invitationToken: 'token-1', redirectPath: '/x' }),
        ),
      ).toEqual({ mode: 'invite', invitationToken: 'token-1', redirectPath: '/x' })
    })
  })

  describe('GIVEN a state that is not a legacy one', () => {
    it.each([
      ['a signed state', '1793952050.abcdef0123456789'],
      ['a JSON array', '[]'],
      ['a JSON number', '42'],
      ['a mode that is not a string', JSON.stringify({ mode: 1 })],
      ['an empty state', ''],
      ['a state without a mode', JSON.stringify({ redirectPath: '/x' })],
      ['a mode the callback does not know', JSON.stringify({ mode: 'other' })],
    ])('THEN should return undefined for %s', (_, state) => {
      expect(parseLegacyGoogleState(state)).toBeUndefined()
    })
  })
})
