import { gql, useApolloClient } from '@apollo/client'
import { Stack } from '@mui/material'
import _findKey from 'lodash/findKey'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { object, string } from 'yup'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { hasDefinedGQLError, onLogIn, removeItemFromLS } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
import { LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY } from '~/core/constants/localStorageKeys'
import { LOGIN_ROUTE } from '~/core/router'
import { addValuesToUrlState } from '~/core/utils/urlUtils'
import {
  CurrentUserFragmentDoc,
  LagoApiError,
  useAcceptInviteMutation,
  useFetchOktaAuthorizeUrlMutation,
  useGetinviteQuery,
  useGoogleAcceptInviteMutation,
  useOktaAcceptInviteMutation,
} from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'
import { tw } from '~/styles/utils'

gql`
  query getinvite($token: String!) {
    invite(token: $token) {
      id
      email
      organization {
        id
        name
      }
    }
  }

  mutation acceptInvite($input: AcceptInviteInput!) {
    acceptInvite(input: $input) {
      token
    }
  }

  mutation googleAcceptInvite($input: GoogleAcceptInviteInput!) {
    googleAcceptInvite(input: $input) {
      token
    }
  }

  mutation fetchOktaAuthorizeUrl($input: OktaAuthorizeInput!) {
    oktaAuthorize(input: $input) {
      url
    }
  }

  mutation oktaAcceptInvite($input: OktaAcceptInviteInput!) {
    oktaAcceptInvite(input: $input) {
      token
    }
  }

  ${CurrentUserFragmentDoc}
`

type Fields = { password: string }
enum FORM_ERRORS {
  REQUIRED_PASSWORD = 'requiredPassword',
  LOWERCASE = 'text_63246f875e2228ab7b63dcfa',
  UPPERCASE = 'text_63246f875e2228ab7b63dd11',
  NUMBER = 'text_63246f875e2228ab7b63dd15',
  SPECIAL = 'text_63246f875e2228ab7b63dd17',
  MIN = 'text_63246f875e2228ab7b63dd1a',
}

const PASSWORD_VALIDATION = [
  FORM_ERRORS.LOWERCASE,
  FORM_ERRORS.SPECIAL,
  FORM_ERRORS.UPPERCASE,
  FORM_ERRORS.MIN,
  FORM_ERRORS.NUMBER,
]

const Invitation = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const { translate } = useInternationalization()
  const { token } = useParams()
  const client = useApolloClient()
  const [searchParams] = useSearchParams()

  const googleCode = searchParams.get('code') || ''
  const oktaCode = searchParams.get('oktaCode') || ''
  const oktaState = searchParams.get('oktaState') || ''

  const { data, error, loading } = useGetinviteQuery({
    context: { silentErrorCodes: [LagoApiError.InviteNotFound] },
    variables: { token: token || '' },
    skip: !token || isAuthenticated, // We need to skip when authenticated to prevent an error flash on the form after submit
  })
  const email = data?.invite?.email

  const [acceptInvite, { error: acceptInviteError, loading: acceptInviteLoading }] =
    useAcceptInviteMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted: async (res) => {
        if (!!res?.acceptInvite) {
          await onLogIn(client, res?.acceptInvite.token)
        }
      },
    })

  const [googleAcceptInvite, { error: googleAcceptInviteError }] = useGoogleAcceptInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (!!res?.googleAcceptInvite) {
        await onLogIn(client, res?.googleAcceptInvite.token)
      }
    },
  })

  const [
    fetchOktaAuthorizeUrl,
    { error: oktaAuthorizeUrlError, loading: oktaAuthorizeUrlLoading },
  ] = useFetchOktaAuthorizeUrlMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    fetchPolicy: 'network-only',
  })

  const [oktaAcceptInvite, { error: oktaAcceptInviteError, loading: oktaAcceptInviteLoading }] =
    useOktaAcceptInviteMutation({
      context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
      onCompleted: async (res) => {
        if (!!res?.oktaAcceptInvite) {
          await onLogIn(client, res?.oktaAcceptInvite.token)
        }
      },
    })

  const [formFields, setFormFields] = useState<Fields>({
    password: '',
  })
  const [errors, setErrors] = useState<FORM_ERRORS[]>([])

  const validationSchema = useMemo(
    () =>
      object().shape({
        password: string()
          .min(8, FORM_ERRORS.MIN)
          .matches(RegExp('(.*[a-z].*)'), FORM_ERRORS.LOWERCASE)
          .matches(RegExp('(.*[A-Z].*)'), FORM_ERRORS.UPPERCASE)
          .matches(RegExp('(.*\\d.*)'), FORM_ERRORS.NUMBER)
          .matches(RegExp('[/_!@#$%^&*(),.?":{}|<>/-]'), FORM_ERRORS.SPECIAL),
      }),
    [],
  )

  const onInvitation = async () => {
    const { password } = formFields

    // make sure no previous visited route is saved in the LS
    removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)

    await acceptInvite({
      variables: {
        input: {
          token: token || '',
          email: email || '',
          password: password || '',
        },
      },
    })
  }

  const onOktaLogin = async () => {
    const { data: oktaAuthorizeData } = await fetchOktaAuthorizeUrl({
      variables: {
        input: {
          email: email || '',
        },
      },
    })

    if (oktaAuthorizeData?.oktaAuthorize?.url) {
      window.location.href = addValuesToUrlState({
        url: oktaAuthorizeData.oktaAuthorize.url,
        values: {
          invitationToken: token || '',
        },
        stateType: 'string',
      })
    }
  }

  useEffect(() => {
    validationSchema
      .validate(formFields, { abortEarly: false })
      .catch((err) => err)
      .then((param) => {
        if (!!param?.errors && param.errors.length > 0) {
          setErrors(param.errors)
        } else {
          setErrors([])
        }
      })
  }, [formFields, validationSchema])

  useEffect(() => {
    if (!!googleCode && !!token) {
      googleAcceptInvite({
        variables: {
          input: {
            code: googleCode,
            inviteToken: token || '',
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleCode, token])

  useEffect(() => {
    if (!!oktaCode && !!oktaState && !!token) {
      oktaAcceptInvite({
        variables: {
          input: {
            code: oktaCode,
            state: oktaState,
            inviteToken: token || '',
          },
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oktaCode, oktaState, token])

  const errorTranslation: string | undefined = useMemo(() => {
    if (
      !acceptInviteError &&
      !googleAcceptInviteError &&
      !oktaAcceptInviteError &&
      !oktaAuthorizeUrlError
    )
      return

    // If any error occur, we need to remove the code from the URL
    history.replaceState({}, '', window.location.pathname)

    if (
      hasDefinedGQLError('InvalidGoogleCode', googleAcceptInviteError) ||
      hasDefinedGQLError('InvalidGoogleToken', googleAcceptInviteError)
    ) {
      return translate('text_660bf95c75dd928ced0ecb25', {
        href: DOCUMENTATION_ENV_VARS,
      })
    }

    if (hasDefinedGQLError('InviteEmailMistmatch', googleAcceptInviteError)) {
      return translate('text_660bf95c75dd928ced0ecb2b')
    }

    if (hasDefinedGQLError('DomainNotConfigured', oktaAuthorizeUrlError)) {
      return translate('text_664c90c9b2b6c2012aa50bd1')
    }

    if (hasDefinedGQLError('OktaUserinfoError', oktaAcceptInviteError)) {
      return translate('text_664c98989d08a3f733357f73')
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', oktaAcceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_664c732c264d7eed1c74fda2'),
      })
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', googleAcceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_1752158380555upqjf6cxtq9'),
      })
    }

    if (hasDefinedGQLError('LoginMethodNotAuthorized', acceptInviteError)) {
      return translate('text_17521583805554mlsol8fld6', {
        method: translate('text_1752158380555c18bvtn8gd8'),
      })
    }

    return

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptInviteError, googleAcceptInviteError, oktaAcceptInviteError, oktaAuthorizeUrlError])

  useShortcuts([
    {
      keys: ['Enter'],
      disabled: errors.length > 0,
      action: onInvitation,
    },
  ])

  const hasValidationErrors = errors.some((err) => PASSWORD_VALIDATION.includes(err))

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        {(!!error || !data?.invite) && !loading && (
          <>
            <Title>{translate('text_63246f875e2228ab7b63dcf4')}</Title>
            <Subtitle noMargins>{translate('text_63246f875e2228ab7b63dcfe')}</Subtitle>
          </>
        )}
        {!error && !!loading && (
          <>
            <Skeleton variant="text" className="mb-8 w-52" />
            <Skeleton variant="text" className="mb-4 w-110" />
            <Skeleton variant="text" className="w-76" />
          </>
        )}
        {!error && !loading && (
          <Stack spacing={8}>
            <Stack spacing={3}>
              <Typography variant="headline">
                {translate('text_664c90c9b2b6c2012aa50bcd', {
                  orgnisationName: data?.invite?.organization.name,
                })}
              </Typography>
              <Typography>{translate('text_63246f875e2228ab7b63dcd4')}</Typography>
            </Stack>

            {!!errorTranslation && (
              <Alert type="danger" data-test="error-alert">
                <Typography color="inherit" html={errorTranslation} />
              </Alert>
            )}

            <Stack spacing={4}>
              <GoogleAuthButton
                mode="invite"
                invitationToken={token || ''}
                label={translate('text_664c90c9b2b6c2012aa50bd3')}
              />

              <Button
                fullWidth
                startIcon="okta"
                size="large"
                variant="tertiary"
                onClick={() => onOktaLogin()}
                loading={oktaAuthorizeUrlLoading || oktaAcceptInviteLoading}
              >
                {translate('text_664c90c9b2b6c2012aa50bd5')}
              </Button>
            </Stack>

            <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
              <Typography variant="captionHl" color="grey500">
                {translate('text_6303351deffd2a0d70498675').toUpperCase()}
              </Typography>
            </div>

            <div className="flex flex-col gap-4">
              <TextInput
                disabled
                name="email"
                beforeChangeFormatter={['lowercase']}
                label={translate('text_63246f875e2228ab7b63dcdc')}
                value={email}
              />

              <div>
                <TextInput
                  name="password"
                  value={formFields.password}
                  password
                  onChange={(value) => setFormFields((prev) => ({ ...prev, password: value }))}
                  label={translate('text_63246f875e2228ab7b63dce9')}
                  placeholder={translate('text_63246f875e2228ab7b63dcf0')}
                />
                {hasValidationErrors && (
                  <div
                    className={tw(
                      'flex flex-wrap overflow-hidden transition-all duration-250',
                      !!formFields.password ? 'mt-4 max-h-124' : 'mt-0 max-h-0',
                    )}
                    data-test={
                      !!formFields.password
                        ? 'password-validation--visible'
                        : 'password-validation--hidden'
                    }
                  >
                    {PASSWORD_VALIDATION.map((err) => {
                      const isErrored = errors.includes(err)

                      return (
                        <div
                          className="mb-3 flex h-5 w-1/2 flex-row items-center gap-3"
                          key={err}
                          data-test={
                            isErrored ? _findKey(FORM_ERRORS, (v) => v === err) : undefined
                          }
                        >
                          <svg height={8} width={8}>
                            <circle
                              cx="4"
                              cy="4"
                              r="4"
                              fill={
                                isErrored ? theme.palette.primary.main : theme.palette.grey[500]
                              }
                            />
                          </svg>
                          <Typography
                            variant="caption"
                            color={isErrored ? 'textSecondary' : 'textPrimary'}
                          >
                            {translate(err)}
                          </Typography>
                        </div>
                      )
                    })}
                  </div>
                )}
                {!errorTranslation && !hasValidationErrors && (
                  <Alert type="success" data-test="success" className="mt-3">
                    {translate('text_63246f875e2228ab7b63dd02')}
                  </Alert>
                )}
              </div>
            </div>

            <Button
              data-test="submit-button"
              disabled={errors.length > 0}
              loading={acceptInviteLoading}
              fullWidth
              size="large"
              onClick={onInvitation}
            >
              {translate('text_63246f875e2228ab7b63dd1c')}
            </Button>
            <Typography
              variant="caption"
              html={translate('text_63246f875e2228ab7b63dd1f', { link: LOGIN_ROUTE })}
            />
          </Stack>
        )}
      </Card>
    </Page>
  )
}

export default Invitation
