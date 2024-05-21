import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import _findKey from 'lodash/findKey'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
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
      user {
        id
        ...CurrentUser
      }
    }
  }

  mutation googleAcceptInvite($input: GoogleAcceptInviteInput!) {
    googleAcceptInvite(input: $input) {
      token
      user {
        id
        ...CurrentUser
      }
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
      user {
        id
        ...CurrentUser
      }
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
  let [searchParams] = useSearchParams()
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
      onCompleted(res) {
        if (!!res?.acceptInvite) {
          onLogIn(res?.acceptInvite.token, res?.acceptInvite?.user)
        }
      },
    })

  const [googleAcceptInvite, { error: googleAcceptInviteError }] = useGoogleAcceptInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (!!res?.googleAcceptInvite) {
        onLogIn(res?.googleAcceptInvite.token, res?.googleAcceptInvite?.user)
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
      onCompleted(res) {
        if (!!res?.oktaAcceptInvite) {
          onLogIn(res?.oktaAcceptInvite.token, res?.oktaAcceptInvite?.user)
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

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        {(!!error || !data?.invite) && !loading ? (
          <>
            <Title variant="headline">{translate('text_63246f875e2228ab7b63dcf4')}</Title>
            <Subtitle $noMargins>{translate('text_63246f875e2228ab7b63dcfe')}</Subtitle>
          </>
        ) : !!loading ? (
          <>
            <Skeleton variant="text" width={208} height={12} marginBottom={theme.spacing(8)} />
            <Skeleton variant="text" width={440} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={304} height={12} />
          </>
        ) : (
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
                loading={oktaAuthorizeUrlLoading || oktaAcceptInviteLoading || acceptInviteLoading}
              >
                {translate('text_664c90c9b2b6c2012aa50bd5')}
              </Button>
            </Stack>

            <OrSeparator>
              <Typography variant="captionHl" color="grey500">
                {translate('text_6303351deffd2a0d70498675').toUpperCase()}
              </Typography>
            </OrSeparator>

            <InputWrapper>
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
                {errors.some((err) => PASSWORD_VALIDATION.includes(err)) ? (
                  <PasswordValidation
                    data-test={
                      !!formFields.password
                        ? 'password-validation--visible'
                        : 'password-validation--hidden'
                    }
                    $visible={!!formFields.password}
                  >
                    {PASSWORD_VALIDATION.map((err) => {
                      const isErrored = errors.includes(err)

                      return (
                        <ValidationLine
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
                        </ValidationLine>
                      )
                    })}
                  </PasswordValidation>
                ) : (
                  <ValidPasswordAlert type="success" data-test="success">
                    {translate('text_63246f875e2228ab7b63dd02')}
                  </ValidPasswordAlert>
                )}
              </div>
            </InputWrapper>

            <Button
              data-test="submit-button"
              disabled={errors.length > 0}
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

const OrSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing(4)};

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 2px solid ${theme.palette.grey[300]};
  }
`

const PasswordValidation = styled.div<{ $visible: boolean }>`
  margin-top: ${({ $visible }) => ($visible ? theme.spacing(4) : 0)};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: ${({ $visible }) => ($visible ? '500px' : '0px')};
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
`

const ValidPasswordAlert = styled(Alert)`
  flex: 1;
  margin-top: ${theme.spacing(3)};
`

const ValidationLine = styled.div`
  display: flex;
  height: 20px;
  align-items: center;
  width: 50%;
  margin-bottom: ${theme.spacing(3)};

  svg {
    margin-right: ${theme.spacing(3)};
  }
`

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

export default Invitation
