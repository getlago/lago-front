import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { hasDefinedGQLError } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import { LagoApiError, useGetGoogleAuthUrlLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Alert, Button, Typography } from '../designSystem'

export type GoogleAuthModeEnum = 'login' | 'signup' | 'invite'

const getErrorKey = (errorCode: string): string => {
  // Note: some error code are underscrored as they can come from the google callback page via url parameter
  switch (errorCode) {
    case 'invalid_google_token':
    case 'invalid_google_code':
    case 'GoogleAuthMissingSetup':
      return 'text_660bf95c75dd928ced0ecb25'
    case 'user_does_not_exist':
      return 'text_660bfaa2cbc95800a63f48b1'
    default:
      return 'text_62b31e1f6a5b8b1b745ece48'
  }
}

gql`
  query getGoogleAuthUrl {
    googleAuthUrl {
      url
    }
  }
`

type BasicGoogleAuthButtonProps = {
  mode: GoogleAuthModeEnum
  label: string
  invitationToken?: string
  hideAlert?: boolean
}

const GoogleAuthButton = ({
  invitationToken,
  hideAlert,
  label,
  mode,
}: BasicGoogleAuthButtonProps) => {
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
      {!!errorCode && !hideAlert && (
        <Alert type="danger">
          <Typography
            color="textSecondary"
            html={translate(getErrorKey(errorCode), { href: DOCUMENTATION_ENV_VARS })}
          />
        </Alert>
      )}

      <Button
        fullWidth
        startIcon="google"
        size="large"
        variant="tertiary"
        onClick={async () => {
          // Ignored because error received here is a 500, and is not well formated for this use case
          // @ts-ignore
          const { data, errors } = await getGoogleUrl()

          // Note: keep underscore notation for some error codes
          if (hasDefinedGQLError('GoogleAuthMissingSetup', errors)) {
            return setErrorCode('GoogleAuthMissingSetup')
          } else if (hasDefinedGQLError('InvalidGoogleCode', errors)) {
            return setErrorCode('invalid_google_code')
          } else if (hasDefinedGQLError('InvalidGoogleToken', errors)) {
            return setErrorCode('invalid_google_token')
          } else if (hasDefinedGQLError('UserDoesNotExist', errors)) {
            return setErrorCode('user_does_not_exist')
          }

          if (data?.googleAuthUrl?.url) {
            window.location.href = addValuesToUrlState(data.googleAuthUrl.url, {
              mode,
              ...(!!invitationToken && { invitationToken }),
            })
          }
        }}
      >
        {label}
      </Button>
    </Stack>
  )
}

export default GoogleAuthButton
