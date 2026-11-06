import { gql, useApolloClient } from '@apollo/client'
import { useEffect, useState } from 'react'

import { getGraphQLErrorCode, onLogIn } from '~/core/apolloClient'
import { authTokenVar } from '~/core/apolloClient/reactiveVars'
import { removeItemFromLS } from '~/core/utils/localStorage'
import { SELF_SERVE_SIGNUP_SECRET_LS_KEY } from '~/core/utils/localStorageKeys'
import {
  ExchangeSignupSecretDocument,
  ExchangeSignupSecretMutation,
  ExchangeSignupSecretMutationVariables,
  LagoApiError,
  SignupStatusDocument,
  SignupStatusEnum,
  SignupStatusQuery,
  SignupStatusQueryVariables,
} from '~/generated/graphql'

import { POLL_INTERVAL_MS, RATE_LIMITED_POLL_INTERVAL_MS } from './constants'
import { ApplyResendState, CheckEmailScreen } from './types'

gql`
  query signupStatus($signupSecret: String!, $withResendState: Boolean!) {
    signupStatus(signupSecret: $signupSecret) {
      status
      resendAvailableInSeconds @include(if: $withResendState)
      resendLimitReached @include(if: $withResendState)
    }
  }

  mutation exchangeSignupSecret($input: ExchangeSignupSecretInput!) {
    exchangeSignupSecret(input: $input) {
      token
    }
  }
`

type UseSignupStatusPollingProps = {
  signupSecret: string
  pollRequest: number
  onStartAgain: () => void
  onResendState: ApplyResendState
}

export const useSignupStatusPolling = ({
  signupSecret,
  pollRequest,
  onStartAgain,
  onResendState,
}: UseSignupStatusPollingProps): CheckEmailScreen => {
  const client = useApolloClient()
  const [screen, setScreen] = useState<CheckEmailScreen>('waiting')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let isActive = true
    let needsResendState = true

    const schedule = (delay: number): void => {
      if (isActive) timer = setTimeout(() => poll().catch(() => schedule(POLL_INTERVAL_MS)), delay)
    }

    const exchangeSecret = async (): Promise<void> => {
      const { data, errors } = await client.mutate<
        ExchangeSignupSecretMutation,
        ExchangeSignupSecretMutationVariables
      >({
        mutation: ExchangeSignupSecretDocument,
        variables: { input: { signupSecret } },
        context: { silentError: true },
        errorPolicy: 'all',
      })

      if (!isActive) return

      const token = data?.exchangeSignupSecret?.token

      if (token) {
        removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
        await onLogIn(client, token)

        if (isActive && !authTokenVar()) setScreen('loginRequired')

        return
      }

      const code = getGraphQLErrorCode(errors?.[0]?.extensions)

      switch (code) {
        case LagoApiError.SignupSecretExpired:
          removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
          return setScreen('loginRequired')
        case LagoApiError.NotFound:
          return onStartAgain()
        case LagoApiError.TooManyRequests:
          return schedule(RATE_LIMITED_POLL_INTERVAL_MS)
        case LagoApiError.LockAcquisitionFailed:
          return schedule(POLL_INTERVAL_MS)
        default:
          return setScreen('loginRequired')
      }
    }

    const poll = async (): Promise<void> => {
      if (document.visibilityState !== 'visible') return schedule(POLL_INTERVAL_MS)

      const { data, errors } = await client.query<SignupStatusQuery, SignupStatusQueryVariables>({
        query: SignupStatusDocument,
        variables: { signupSecret, withResendState: needsResendState },
        fetchPolicy: 'no-cache',
        context: { silentError: true },
        errorPolicy: 'all',
      })

      if (!isActive) return

      if (getGraphQLErrorCode(errors?.[0]?.extensions) === LagoApiError.TooManyRequests) {
        return schedule(RATE_LIMITED_POLL_INTERVAL_MS)
      }

      const signupStatus = data?.signupStatus

      if (!signupStatus) return schedule(POLL_INTERVAL_MS)

      switch (signupStatus.status) {
        case SignupStatusEnum.Verified:
          return exchangeSecret()
        case SignupStatusEnum.Expired:
          removeItemFromLS(SELF_SERVE_SIGNUP_SECRET_LS_KEY)
          return setScreen('expired')
        case SignupStatusEnum.Invalid:
          return onStartAgain()
        default:
          if (needsResendState) {
            needsResendState = false
            onResendState(signupStatus.resendAvailableInSeconds, !!signupStatus.resendLimitReached)
          }

          return schedule(POLL_INTERVAL_MS)
      }
    }

    poll().catch(() => schedule(POLL_INTERVAL_MS))

    return (): void => {
      isActive = false
      clearTimeout(timer)
    }
  }, [client, onResendState, onStartAgain, pollRequest, signupSecret])

  return screen
}
