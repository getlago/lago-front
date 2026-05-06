import { ApolloError } from '@apollo/client'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'

type UseNotFoundRedirectArgs = {
  error: ApolloError | undefined
  loading: boolean
  redirectTo: string
  translateKey: string
}

export const useNotFoundRedirect = ({
  error,
  loading,
  redirectTo,
  translateKey,
}: UseNotFoundRedirectArgs) => {
  const navigate = useNavigate()
  const isNotFoundError = hasDefinedGQLError('NotFound', error)

  useEffect(() => {
    if (loading || !isNotFoundError) return

    addToast({
      severity: 'info',
      translateKey,
    })
    navigate(redirectTo, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isNotFoundError])
}
