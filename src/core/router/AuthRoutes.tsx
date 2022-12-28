import { lazy } from 'react'

import { envGlobalVar } from '~/core/apolloClient'

import { CustomRouteObject } from './types'

const { disableSignUp } = envGlobalVar()

// ----------- Pages -----------
const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)

const Invitation = lazy(() => import(/* webpackChunkName: 'invitation' */ '~/pages/Invitation'))

// ----------- Routes -----------
export const LOGIN_ROUTE = '/login'
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
export const SIGN_UP_ROUTE = '/sign-up'
export const INVITATION_ROUTE = '/invitation/:token'

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
    path: FORGOT_PASSWORD_ROUTE,
    element: <ForgotPassword />,
    onlyPublic: true,
  },

  {
    path: INVITATION_ROUTE,
    element: <Invitation />,
    onlyPublic: true,
  },
]
