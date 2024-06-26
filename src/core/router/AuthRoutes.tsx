import { envGlobalVar } from '~/core/apolloClient'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

const { disableSignUp } = envGlobalVar()

// ----------- Pages -----------
const Login = lazyLoad(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazyLoad(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazyLoad(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword'),
)
const ResetPassword = lazyLoad(
  () => import(/* webpackChunkName: 'reset-password' */ '~/pages/auth/ResetPassword'),
)

const Invitation = lazyLoad(() => import(/* webpackChunkName: 'invitation' */ '~/pages/Invitation'))
const InvitationInit = lazyLoad(
  () => import(/* webpackChunkName: 'invitation-init' */ '~/pages/InvitationInit'),
)
const GoogleAuthCallback = lazyLoad(
  () => import(/* webpackChunkName: 'google-auth-callback' */ '~/pages/auth/GoogleAuthCallback'),
)
const LoginOkta = lazyLoad(
  () => import(/* webpackChunkName: 'login-okta' */ '~/pages/auth/LoginOkta'),
)
const OktaAuthCallback = lazyLoad(
  () => import(/* webpackChunkName: 'okta-auth-callback' */ '~/pages/auth/OktaAuthCallback'),
)

// ----------- Routes -----------
export const LOGIN_ROUTE = '/login'
export const LOGIN_OKTA = `${LOGIN_ROUTE}/okta`
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
export const RESET_PASSWORD_ROUTE = '/reset-password/:token'
export const SIGN_UP_ROUTE = '/sign-up'
export const INVITATION_ROUTE = '/invitation/:token'
export const INVITATION_ROUTE_FORM = '/invitation/:token/form'
export const GOOGLE_AUTH_CALLBACK = '/auth/google/callback'
export const OKTA_AUTH_CALLBACK = '/auth/okta/callback'

export const authRoutes: CustomRouteObject[] = [
  ...(!disableSignUp
    ? [
        {
          path: SIGN_UP_ROUTE,
          element: <SignUp />,
          onlyPublic: true,
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
    invitation: true,
  },
]
