import {
  AUTH_TOKEN_LS_KEY,
  authTokenVar,
  updateAuthTokenVar,
} from '~/core/apolloClient/reactiveVars/authTokenVar'

describe('authTokenVar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('GIVEN updateAuthTokenVar is called with a token', () => {
    describe('WHEN the token is a string', () => {
      it('THEN should persist it verbatim', () => {
        updateAuthTokenVar('a-real-token')

        expect(localStorage.getItem(AUTH_TOKEN_LS_KEY)).toBe('a-real-token')
      })

      it('THEN should expose it on the var', () => {
        updateAuthTokenVar('a-real-token')

        expect(authTokenVar()).toBe('a-real-token')
      })
    })
  })

  describe('GIVEN updateAuthTokenVar is called with no argument (log out)', () => {
    describe('WHEN a token was previously stored', () => {
      it('THEN should remove the key instead of storing the string "undefined"', () => {
        updateAuthTokenVar('a-real-token')

        updateAuthTokenVar()

        expect(localStorage.getItem(AUTH_TOKEN_LS_KEY)).toBeNull()
      })

      it('THEN should clear the var', () => {
        updateAuthTokenVar('a-real-token')

        updateAuthTokenVar()

        expect(authTokenVar()).toBeUndefined()
      })
    })
  })
})
