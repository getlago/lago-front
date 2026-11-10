import { configure, render, screen } from '@testing-library/react'
import { Suspense } from 'react'

import type { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'

import { CREATE_ORGANIZATION_ROUTE } from '../paths/createOrganization'
import type { CustomRouteObject } from '../types'

configure({ testIdAttribute: 'data-test' })

type AuthRoutesModule = typeof import('../AuthRoutes')
type SignUpFlags = Pick<ReturnType<typeof envGlobalVar>, 'disableSignUp' | 'selfServeEnabled'>

const MOCK_SIGN_UP_PAGE_TEST_ID = 'legacy-sign-up-page'
const MOCK_SELF_SERVE_SIGN_UP_PAGE_TEST_ID = 'self-serve-sign-up-page'
const MOCK_VERIFY_EMAIL_PAGE_TEST_ID = 'verify-email-page'
const MOCK_CREATE_ORGANIZATION_PAGE_TEST_ID = 'create-organization-page'
const VERIFY_EMAIL_ROUTE = '/verify-email'

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

jest.mock('~/pages/auth/VerifyEmail', () => ({
  __esModule: true,
  default: () => <div data-test={MOCK_VERIFY_EMAIL_PAGE_TEST_ID} />,
}))

jest.mock('~/pages/auth/CreateOrganization', () => ({
  __esModule: true,
  default: () => <div data-test={MOCK_CREATE_ORGANIZATION_PAGE_TEST_ID} />,
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

  describe('GIVEN the verify email link is opened', () => {
    describe('WHEN the self-serve flag is on', () => {
      it('THEN should register the verify email route as public, open to a logged in browser', async () => {
        const { authRoutes } = await loadAuthRoutes({
          disableSignUp: false,
          selfServeEnabled: true,
        })
        const verifyEmailRoute = findRoute(authRoutes, VERIFY_EMAIL_ROUTE)

        expect(verifyEmailRoute).toBeDefined()
        expect(verifyEmailRoute?.onlyPublic).toBeUndefined()
        expect(verifyEmailRoute?.private).toBeUndefined()
      })

      it('THEN should keep the verify email route, whose URL carries a single-use token, out of the location history', async () => {
        const { authRoutes } = await loadAuthRoutes({
          disableSignUp: false,
          selfServeEnabled: true,
        })

        expect(findRoute(authRoutes, VERIFY_EMAIL_ROUTE)?.skipLocationHistory).toBe(true)
      })

      it('THEN should render the verify email page', async () => {
        const { authRoutes } = await loadAuthRoutes({
          disableSignUp: false,
          selfServeEnabled: true,
        })

        render(
          <Suspense fallback={null}>{findRoute(authRoutes, VERIFY_EMAIL_ROUTE)?.element}</Suspense>,
        )

        expect(await screen.findByTestId(MOCK_VERIFY_EMAIL_PAGE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the self-serve flag is off', () => {
      it('THEN should not register the verify email route', async () => {
        const { authRoutes } = await loadAuthRoutes({
          disableSignUp: false,
          selfServeEnabled: false,
        })

        expect(findRoute(authRoutes, VERIFY_EMAIL_ROUTE)).toBeUndefined()
      })
    })

    describe('WHEN the self-serve flag is on but the sign-up is disabled', () => {
      it('THEN should not register the verify email route', async () => {
        const { authRoutes } = await loadAuthRoutes({
          disableSignUp: true,
          selfServeEnabled: true,
        })

        expect(findRoute(authRoutes, VERIFY_EMAIL_ROUTE)).toBeUndefined()
      })
    })
  })

  describe('GIVEN a user without an organization opens the create organization route', () => {
    describe.each([
      ['enabled', false],
      ['disabled', true],
    ])('WHEN the self-serve flag is on and the sign-up is %s', (_, disableSignUp) => {
      it('THEN should register the create organization route as private', async () => {
        const { authRoutes } = await loadAuthRoutes({ disableSignUp, selfServeEnabled: true })
        const createOrganizationRoute = findRoute(authRoutes, CREATE_ORGANIZATION_ROUTE)

        expect(createOrganizationRoute).toMatchObject({ private: true })
        expect(createOrganizationRoute?.onlyPublic).toBeFalsy()
      })

      it('THEN should render the create organization page', async () => {
        const { authRoutes } = await loadAuthRoutes({ disableSignUp, selfServeEnabled: true })

        render(
          <Suspense fallback={null}>
            {findRoute(authRoutes, CREATE_ORGANIZATION_ROUTE)?.element}
          </Suspense>,
        )

        expect(await screen.findByTestId(MOCK_CREATE_ORGANIZATION_PAGE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe.each([
      ['enabled', false],
      ['disabled', true],
    ])('WHEN the self-serve flag is off and the sign-up is %s', (_, disableSignUp) => {
      it('THEN should not register the create organization route', async () => {
        const { authRoutes } = await loadAuthRoutes({ disableSignUp, selfServeEnabled: false })

        expect(findRoute(authRoutes, CREATE_ORGANIZATION_ROUTE)).toBeUndefined()
      })
    })
  })
})
