import { configure, render, screen } from '@testing-library/react'
import { Suspense } from 'react'

import type { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'

import type { CustomRouteObject } from '../types'

configure({ testIdAttribute: 'data-test' })

type AuthRoutesModule = typeof import('../AuthRoutes')
type SignUpFlags = Pick<ReturnType<typeof envGlobalVar>, 'disableSignUp' | 'selfServeEnabled'>

const MOCK_SIGN_UP_PAGE_TEST_ID = 'legacy-sign-up-page'
const MOCK_SELF_SERVE_SIGN_UP_PAGE_TEST_ID = 'self-serve-sign-up-page'

const mockEnvGlobalVar = jest.fn<SignUpFlags, []>()

jest.mock('~/core/apolloClient', () => ({
  envGlobalVar: () => mockEnvGlobalVar(),
}))

jest.mock('~/pages/auth/SignUp', () => ({
  __esModule: true,
  default: () => <div data-test={MOCK_SIGN_UP_PAGE_TEST_ID} />,
}))

jest.mock('~/pages/auth/SelfServeSignUp', () => ({
  __esModule: true,
  default: () => <div data-test={MOCK_SELF_SERVE_SIGN_UP_PAGE_TEST_ID} />,
}))

const loadAuthRoutes = async (flags: SignUpFlags): Promise<AuthRoutesModule> => {
  mockEnvGlobalVar.mockReturnValue(flags)

  return import('../AuthRoutes')
}

const findRoute = (routes: CustomRouteObject[], path: string): CustomRouteObject | undefined =>
  routes.find((route) => route.path === path)

const loadSignUpRoute = async (flags: SignUpFlags): Promise<CustomRouteObject | undefined> => {
  const { authRoutes, SIGN_UP_ROUTE } = await loadAuthRoutes(flags)

  return findRoute(authRoutes, SIGN_UP_ROUTE)
}

const renderSignUpRoute = async (flags: SignUpFlags): Promise<void> => {
  const signUpRoute = await loadSignUpRoute(flags)

  render(<Suspense fallback={null}>{signUpRoute?.element}</Suspense>)
}

describe('authRoutes', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  describe('GIVEN the sign-up is enabled', () => {
    describe('WHEN the self-serve flag is on', () => {
      it('THEN should register the sign-up route as public only', async () => {
        const signUpRoute = await loadSignUpRoute({ disableSignUp: false, selfServeEnabled: true })

        expect(signUpRoute).toMatchObject({ onlyPublic: true })
      })

      it('THEN should render the self-serve sign-up page', async () => {
        await renderSignUpRoute({ disableSignUp: false, selfServeEnabled: true })

        expect(await screen.findByTestId(MOCK_SELF_SERVE_SIGN_UP_PAGE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_SIGN_UP_PAGE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the self-serve flag is off', () => {
      it('THEN should register the sign-up route as public only', async () => {
        const signUpRoute = await loadSignUpRoute({ disableSignUp: false, selfServeEnabled: false })

        expect(signUpRoute).toMatchObject({ onlyPublic: true })
      })

      it('THEN should render the legacy sign-up page', async () => {
        await renderSignUpRoute({ disableSignUp: false, selfServeEnabled: false })

        expect(await screen.findByTestId(MOCK_SIGN_UP_PAGE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(MOCK_SELF_SERVE_SIGN_UP_PAGE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the sign-up is disabled', () => {
    describe.each([
      ['on', true],
      ['off', false],
    ])('WHEN the self-serve flag is %s', (_, selfServeEnabled) => {
      it('THEN should not register the sign-up route', async () => {
        const { authRoutes, SIGN_UP_ROUTE } = await loadAuthRoutes({
          disableSignUp: true,
          selfServeEnabled,
        })

        expect(findRoute(authRoutes, SIGN_UP_ROUTE)).toBeUndefined()
      })

      it('THEN should keep the login route', async () => {
        const { authRoutes, LOGIN_ROUTE } = await loadAuthRoutes({
          disableSignUp: true,
          selfServeEnabled,
        })

        expect(findRoute(authRoutes, LOGIN_ROUTE)).toBeDefined()
      })
    })
  })
})
