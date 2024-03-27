import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { hasDefinedGQLError } from '~/core/apolloClient'
import { addModeToUrlState } from '~/core/utils/urlUtils'
import { LagoApiError, useGetGoogleAuthUrlLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Alert, Button } from '../designSystem'

export type GoogleAuthModeEnum = 'login' | 'signup'

const getErrorKey = (errorCode: string): string => {
  switch (errorCode) {
    case LagoApiError.InvalidGoogleToken:
      return 'TODO: This is the error message for invalid google code'
    case LagoApiError.InvalidGoogleCode:
      return 'TODO: This is the error message for invalid google code'
    case LagoApiError.UserDoesNotExists:
      return 'TODO: This is the error message for non existing user'
    case LagoApiError.GoogleAuthMissingSetup:
      return 'TODO: This is the error message for missing google setup'
    default:
      return 'TODO: This is the default error message'
  }
}

gql`
  query getGoogleAuthUrl {
    googleAuthUrl {
      url
    }
  }
`

type GoogleAuthButtonProps = {
  mode: GoogleAuthModeEnum
  label: string
}

const GoogleAuthButton = ({ label, mode }: GoogleAuthButtonProps) => {
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()

  const [errorCode, setErrorCode] = useState<string | undefined>(undefined)
  const lagoErrorCode = searchParams.get('lago_error_code') || ''

  const [getGoogleUrl] = useGetGoogleAuthUrlLazyQuery({
    fetchPolicy: 'network-only',
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  useEffect(() => {
    if (lagoErrorCode) {
      // Set the error code to be displayed
      setErrorCode(lagoErrorCode)
      // Remove the error code from the URL, so it disappears on page reload
      history.replaceState({}, '', window.location.pathname)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Stack spacing={8}>
      {!!errorCode && <Alert type="danger">{translate(getErrorKey(errorCode))}</Alert>}

      <Button
        fullWidth
        startIcon="google"
        size="large"
        variant="tertiary"
        onClick={async () => {
          // Ignored because error received here is a 500, and is not well formated for this use case
          // @ts-ignore
          const { data, errors } = await getGoogleUrl()

          if (hasDefinedGQLError('GoogleAuthMissingSetup', errors)) {
            setErrorCode('GoogleAuthMissingSetup')
          } else if (hasDefinedGQLError('InvalidGoogleCode', errors)) {
            setErrorCode('InvalidGoogleCode')
          } else if (hasDefinedGQLError('InvalidGoogleToken', errors)) {
            setErrorCode('InvalidGoogleToken')
          } else if (hasDefinedGQLError('UserDoesNotExists', errors)) {
            setErrorCode('UserDoesNotExists')
          }

          if (data?.googleAuthUrl?.url) {
            window.location.href = addModeToUrlState(data.googleAuthUrl.url, mode)
          }
        }}
      >
        {label}
      </Button>
    </Stack>
  )
}

export default GoogleAuthButton
