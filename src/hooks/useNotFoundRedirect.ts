import { ApolloError } from '@apollo/client'
import { useEffect } from 'react'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { useNavigate } from '~/core/router'

type UseNotFoundRedirectArgs = {
  error: ApolloError | undefined
  loading: boolean
  notFound?: boolean
  redirectTo: string
  translateKey: string
}

export const useNotFoundRedirect = ({
  error,
  loading,
  notFound = false,
  redirectTo,
  translateKey,
}: UseNotFoundRedirectArgs) => {
  const navigate = useNavigate()
  const isNotFound = hasDefinedGQLError('NotFound', error) || notFound

  useEffect(() => {
    if (loading || !isNotFound) return

    addToast({
      severity: 'info',
      translateKey,
    })
    navigate(redirectTo, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isNotFound])
}
