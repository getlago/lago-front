import { gql, useApolloClient } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { revalidateLogic } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar, hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { authenticationMethodsMapping } from '~/core/constants/authenticationMethodsMapping'
import {
  FORGOT_PASSWORD_ROUTE,
  Link,
  LOGIN_ENTRA_ID_ROUTE,
  LOGIN_OKTA,
  SIGN_UP_ROUTE,
  useLocation,
  useNavigate,
} from '~/core/router'
import { AuthenticationMethodsEnum, LagoApiError, useLoginUserMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useIframeConfig } from '~/hooks/useIframeConfig'
import { Card, Page, StyledLogo } from '~/styles/auth'

import { loginDefaultValues, loginValidationSchema } from './loginForm/validationSchema'

const { disableSignUp } = envGlobalVar()

gql`
  mutation loginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      token
    }
  }
`

const Login = () => {
  const { translate } = useInternationalization()
  const { isRunningInSalesForceIframe, isRunningInIframeContext } = useIframeConfig()
  const location = useLocation()
  const navigate = useNavigate()
  const { closePanel: closeDevTool } = useDeveloperTool()
  const client = useApolloClient()
  const [authMethodError, setAuthMethodError] = useState<AuthenticationMethodsEnum>()
  const [searchParams] = useSearchParams()

  const lagoErrorCode = searchParams.get('lago_error_code')

  useEffect(() => {
    // Okta and Entra ID login methods not authorized
    // Google login method is handled in GoogleAuthButton
    if (lagoErrorCode === LagoApiError.OktaLoginMethodNotAuthorized) {
      setAuthMethodError(AuthenticationMethodsEnum.Okta)
    }

    if (lagoErrorCode === LagoApiError.EntraIdLoginMethodNotAuthorized) {
      setAuthMethodError(AuthenticationMethodsEnum.EntraId)
    }
  }, [lagoErrorCode])

  useEffect(() => {
    // In case the devtools are open, close it
    closeDevTool()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [loginUser, { error: loginError }] = useLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (!!res?.loginUser) {
        await onLogIn(client, res.loginUser.token)
      }
    },
    onError(error) {
      if (hasDefinedGQLError('LoginMethodNotAuthorized', error, 'emailPassword')) {
        setAuthMethodError(AuthenticationMethodsEnum.EmailPassword)
      }
    },
    fetchPolicy: 'network-only',
  })

  const form = useAppForm({
    defaultValues: loginDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: loginValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await loginUser({
        variables: {
          input: {
            email: value.email,
            password: value.password,
          },
        },
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={8}>
            <Stack spacing={3}>
              <Typography variant="headline">
                {translate('text_620bc4d4269a55014d493f08')}
              </Typography>
              <Typography>{translate('text_620bc4d4269a55014d493f81')}</Typography>
            </Stack>

            {hasDefinedGQLError('IncorrectLoginOrPassword', loginError) && (
              <Alert data-test="incorrect-login-or-password-alert" type="danger">
                {translate('text_620bc4d4269a55014d493fb7')}
              </Alert>
            )}

            {authMethodError && (
              <Alert data-test="login-method-not-authorized-alert" type="danger">
                {translate('text_17521583805554mlsol8fld6', {
                  method: translate(authenticationMethodsMapping[authMethodError]),
                })}
              </Alert>
            )}

            {!isRunningInSalesForceIframe && !isRunningInIframeContext && (
              <>
                <Stack spacing={4}>
                  <GoogleAuthButton
                    mode="login"
                    label={translate('text_660bf95c75dd928ced0ecb31')}
                    hideAlert={!!loginError}
                  />
                  <Button
                    fullWidth
                    startIcon="okta"
                    size="large"
                    variant="tertiary"
                    onClick={() => navigate(LOGIN_OKTA, { state: location.state })}
                  >
                    {translate('text_664c90c9b2b6c2012aa50bce')}
                  </Button>
                  <Button
                    fullWidth
                    startIcon="microsoft"
                    size="large"
                    variant="tertiary"
                    onClick={() => navigate(LOGIN_ENTRA_ID_ROUTE, { state: location.state })}
                  >
                    {translate('text_1784307344254zepa808t6gd')}
                  </Button>
                </Stack>

                <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
                  <Typography variant="captionHl" color="grey500">
                    {translate('text_6303351deffd2a0d70498675').toUpperCase()}
                  </Typography>
                </div>
              </>
            )}

            <div className="flex flex-col gap-4">
              <form.AppField name="email">
                {(field) => (
                  <field.TextInputField
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    beforeChangeFormatter={['lowercase']}
                    label={translate('text_62ab2d0396dd6b0361614d60')}
                    placeholder={translate('text_62a99ba2af7535cefacab4bf')}
                  />
                )}
              </form.AppField>

              <div className="relative">
                <form.AppField name="password">
                  {(field) => (
                    <field.TextInputField
                      password
                      label={translate('text_620bc4d4269a55014d493f32')}
                      placeholder={translate('text_620bc4d4269a55014d493f5b')}
                    />
                  )}
                </form.AppField>
                <Typography className="absolute right-0 top-0" variant="caption">
                  <Link to={generatePath(FORGOT_PASSWORD_ROUTE)}>
                    {translate('text_642707b0da1753a9bb6672b5')}
                  </Link>
                </Typography>
              </div>
            </div>

            <form.AppForm>
              <form.SubmitButton dataTest="submit" fullWidth size="large">
                {translate('text_620bc4d4269a55014d493f6d')}
              </form.SubmitButton>
            </form.AppForm>

            {!disableSignUp && !isRunningInSalesForceIframe && !isRunningInIframeContext && (
              <Typography
                className="mx-auto text-center"
                variant="caption"
                html={translate('text_62c84d0029355c83db4dd186', {
                  linkSignUp: SIGN_UP_ROUTE,
                })}
              />
            )}
          </Stack>
        </form>
      </Card>
    </Page>
  )
}

export default Login
