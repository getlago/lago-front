import { gql, useApolloClient } from '@apollo/client'
import { Stack } from '@mui/material'
import _findKey from 'lodash/findKey'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { object, string } from 'yup'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
import { LOGIN_ROUTE } from '~/core/router'
import { LagoApiError, useGoogleRegisterMutation, useSignupMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'
import { tw } from '~/styles/utils'

gql`
  mutation signup($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
    }
  }

  mutation googleRegister($input: GoogleRegisterUserInput!) {
    googleRegisterUser(input: $input) {
      token
    }
  }
`

type Fields = { email: string; password: string; organizationName: string }
enum FORM_ERRORS {
  REQUIRED_EMAIL = 'requiredEmail',
  REQUIRED_PASSWORD = 'requiredPassword',
  INVALID_EMAIL = 'invalidEmail',
  REQUIRED_NAME = 'requiredName',
  LOWERCASE = 'text_620bc4d4269a55014d493f57',
  UPPERCASE = 'text_620bc4d4269a55014d493f7b',
  NUMBER = 'text_620bc4d4269a55014d493f8d',
  SPECIAL = 'text_620bc4d4269a55014d493fa0',
  MIN = 'text_620bc4d4269a55014d493fac',
}

const PASSWORD_VALIDATION = [
  FORM_ERRORS.LOWERCASE,
  FORM_ERRORS.SPECIAL,
  FORM_ERRORS.UPPERCASE,
  FORM_ERRORS.MIN,
  FORM_ERRORS.NUMBER,
]

const SignUp = () => {
  const client = useApolloClient()
  const [searchParams] = useSearchParams()
  const googleCode = searchParams.get('code') || ''
  const { translate } = useInternationalization()
  const [isGoogleRegister, setIsGoogleRegister] = useState<boolean>(!!googleCode)
  const [signUp, { error: signUpError }] = useSignupMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (!!res?.registerUser) {
        await onLogIn(client, res.registerUser.token)
      }
    },
  })

  const [googleRegister, { error: googleRegisterError }] = useGoogleRegisterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted: async (res) => {
      if (!!res?.googleRegisterUser) {
        await onLogIn(client, res.googleRegisterUser.token)
      }
    },
  })

  const [formFields, setFormFields] = useState<Fields>({
    email: '',
    password: '',
    organizationName: '',
  })
  const [errors, setErrors] = useState<FORM_ERRORS[]>([])
  const validationSchema = useMemo(() => {
    if (isGoogleRegister) {
      return object().shape({
        organizationName: string().required(FORM_ERRORS.REQUIRED_NAME),
      })
    }

    return object().shape({
      email: string().email(FORM_ERRORS.INVALID_EMAIL).required(FORM_ERRORS.REQUIRED_EMAIL),
      organizationName: string().required(FORM_ERRORS.REQUIRED_NAME),
      password: string()
        .min(8, FORM_ERRORS.MIN)
        .matches(RegExp('(.*[a-z].*)'), FORM_ERRORS.LOWERCASE)
        .matches(RegExp('(.*[A-Z].*)'), FORM_ERRORS.UPPERCASE)
        .matches(RegExp('(.*\\d.*)'), FORM_ERRORS.NUMBER)
        .matches(RegExp('[/_!@#$%^&*(),.?":{}|<>/-]'), FORM_ERRORS.SPECIAL),
    })
  }, [isGoogleRegister])

  const errorTranslation: string | undefined = useMemo(() => {
    if (!googleRegisterError && !signUpError) return

    // If any error occur, we need to remove the code from the URL
    history.replaceState({}, '', window.location.pathname)
    setIsGoogleRegister(false)

    if (
      hasDefinedGQLError('UserAlreadyExists', signUpError) ||
      hasDefinedGQLError('UserAlreadyExists', googleRegisterError)
    ) {
      return translate('text_660bf95c75dd928ced0ecb1a', { href: LOGIN_ROUTE })
    }

    if (
      hasDefinedGQLError('InvalidGoogleCode', googleRegisterError) ||
      hasDefinedGQLError('InvalidGoogleToken', googleRegisterError)
    ) {
      return translate('text_660bf95c75dd928ced0ecb25', { href: DOCUMENTATION_ENV_VARS })
    }

    return

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleRegisterError, signUpError])

  useEffect(() => {
    if (googleCode) {
      setIsGoogleRegister(true)
    }
  }, [googleCode])

  const onSignUp = async () => {
    if (isGoogleRegister) {
      await googleRegister({
        variables: {
          input: {
            code: googleCode,
            organizationName: formFields.organizationName,
          },
        },
      })
    } else {
      await signUp({
        variables: {
          input: formFields,
        },
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

  useShortcuts([
    {
      keys: ['Enter'],
      disabled: errors.length > 0,
      action: onSignUp,
    },
  ])

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <Stack spacing={8}>
          <Stack spacing={3}>
            <Title>
              {translate(
                isGoogleRegister
                  ? 'text_660bf95c75dd928ced0ecb04'
                  : 'text_620bc4d4269a55014d493f12',
              )}
            </Title>
            <Subtitle>
              {translate(
                isGoogleRegister
                  ? 'text_660bf95c75dd928ced0ecb08'
                  : 'text_620bc4d4269a55014d493fc9',
              )}
            </Subtitle>
          </Stack>

          {!!errorTranslation && (
            <Alert type="danger" data-test="error-alert">
              <Typography color="inherit" html={errorTranslation} />
            </Alert>
          )}

          {!isGoogleRegister && (
            <>
              <GoogleAuthButton mode="signup" label={translate('text_660bf95c75dd928ced0ecb21')} />

              <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
                <Typography variant="captionHl" color="grey500">
                  {translate('text_6303351deffd2a0d70498675').toUpperCase()}
                </Typography>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4">
            <TextInput
              name="organizationName"
              onChange={(value) => setFormFields((prev) => ({ ...prev, organizationName: value }))}
              label={translate('text_62a99ba2af7535cefacab49c')}
              placeholder={translate('text_660bf95c75dd928ced0ecb33')}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />

            {!isGoogleRegister && (
              <>
                <TextInput
                  name="email"
                  beforeChangeFormatter={['lowercase']}
                  onChange={(value) => setFormFields((prev) => ({ ...prev, email: value }))}
                  label={translate('text_62a99ba2af7535cefacab4aa')}
                  placeholder={translate('text_62a99ba2af7535cefacab4bf')}
                />

                <div>
                  <TextInput
                    name="password"
                    value={formFields.password}
                    password
                    onChange={(value) => setFormFields((prev) => ({ ...prev, password: value }))}
                    label={translate('text_620bc4d4269a55014d493f53')}
                    placeholder={translate('text_620bc4d4269a55014d493f5b')}
                  />
                  {errors.some((err) => PASSWORD_VALIDATION.includes(err)) ? (
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
                  ) : (
                    <Alert className="mt-4" type="success" data-test="success">
                      {translate('text_620bc4d4269a55014d493fbe')}
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>

          <Button
            data-test="submit-button"
            disabled={errors.length > 0}
            fullWidth
            size="large"
            onClick={onSignUp}
          >
            {translate('text_620bc4d4269a55014d493fb5')}
          </Button>

          <Typography
            variant="caption"
            html={translate('text_620bc4d4269a55014d493fd4', { link: LOGIN_ROUTE })}
          />
        </Stack>
      </Card>
    </Page>
  )
}

export default SignUp
