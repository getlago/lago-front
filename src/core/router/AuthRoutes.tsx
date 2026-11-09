import { envGlobalVar } from '~/core/apolloClient'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const { disableSignUp, selfServeEnabled } = envGlobalVar()

// ----------- Pages -----------
const Login = lazyLoad(() => import('~/pages/auth/Login'))
const SignUp = lazyLoad(() => import('~/pages/auth/SignUp'))
const SelfServeSignUp = lazyLoad(() => import('~/pages/auth/SelfServeSignUp'))
const VerifyEmail = lazyLoad(() => import('~/pages/auth/VerifyEmail'))
const ForgotPassword = lazyLoad(() => import('~/pages/auth/ForgotPassword'))
const ResetPassword = lazyLoad(() => import('~/pages/auth/ResetPassword'))

const Invitation = lazyLoad(() => import('~/pages/Invitation'))
const InvitationInit = lazyLoad(() => import('~/pages/InvitationInit'))
const GoogleAuthCallback = lazyLoad(() => import('~/pages/auth/GoogleAuthCallback'))
const LoginOkta = lazyLoad(() => import('~/pages/auth/LoginOkta'))
const OktaAuthCallback = lazyLoad(() => import('~/pages/auth/OktaAuthCallback'))
const LoginEntraId = lazyLoad(() => import('~/pages/auth/LoginEntraId'))
const EntraIdAuthCallback = lazyLoad(() => import('~/pages/auth/EntraIdAuthCallback'))

// ----------- Routes -----------
export const LOGIN_ROUTE = '/login'
export const LOGIN_OKTA = `${LOGIN_ROUTE}/okta`
export const LOGIN_ENTRA_ID_ROUTE = '/login/entra'
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
const RESET_PASSWORD_ROUTE = '/reset-password/:token'

export const SIGN_UP_ROUTE = '/sign-up'
const VERIFY_EMAIL_ROUTE = '/verify-email'

export const INVITATION_ROUTE = '/invitation/:token'
export const INVITATION_ROUTE_FORM = '/invitation/:token/form'
const GOOGLE_AUTH_CALLBACK = '/auth/google/callback'
const OKTA_AUTH_CALLBACK = '/auth/okta/callback'
const ENTRA_ID_AUTH_CALLBACK = '/auth/entra/callback'

export const authRoutes: CustomRouteObject[] = [
  ...(!disableSignUp
    ? [
        {
          path: SIGN_UP_ROUTE,
          element: selfServeEnabled ? <SelfServeSignUp /> : <SignUp />,
          onlyPublic: true,
        },
      ]
    : []),
  ...(!disableSignUp && selfServeEnabled
    ? [
        // Public, not public-only: a browser already logged in must still reach the link
        {
          path: VERIFY_EMAIL_ROUTE,
          element: <VerifyEmail />,
        },
      ]
    : []),
  {
    path: LOGIN_ROUTE,
    element: <Login />,
    onlyPublic: true,
  },
  {
    path: LOGIN_OKTA,
    element: <LoginOkta />,
    onlyPublic: true,
  },
  {
    path: LOGIN_ENTRA_ID_ROUTE,
    element: <LoginEntraId />,
    onlyPublic: true,
  },
  {
    path: FORGOT_PASSWORD_ROUTE,
    element: <ForgotPassword />,
    onlyPublic: true,
  },
  {
    path: GOOGLE_AUTH_CALLBACK,
    element: <GoogleAuthCallback />,
    onlyPublic: true,
  },
  {
    path: OKTA_AUTH_CALLBACK,
    element: <OktaAuthCallback />,
    onlyPublic: true,
  },
  {
    path: ENTRA_ID_AUTH_CALLBACK,
    element: <EntraIdAuthCallback />,
    onlyPublic: true,
  },
  {
    path: RESET_PASSWORD_ROUTE,
    element: <ResetPassword />,
    onlyPublic: true,
  },
  {
    path: INVITATION_ROUTE,
    element: <InvitationInit />,
  },
  {
    path: INVITATION_ROUTE_FORM,
    element: <Invitation />,
  },
]
