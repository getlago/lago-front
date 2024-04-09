import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import _findKey from 'lodash/findKey'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { DOCUMENTATION_ENV_VARS } from '~/core/constants/externalUrls'
import { LOGIN_ROUTE } from '~/core/router'
import {
  CurrentUserFragmentDoc,
  LagoApiError,
  useGoogleRegisterMutation,
  useSignupMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

gql`
  mutation signup($input: RegisterUserInput!) {
    registerUser(input: $input) {
      token
      user {
        id
        ...CurrentUser
      }
    }
  }

  mutation googleRegister($input: GoogleRegisterUserInput!) {
    googleRegisterUser(input: $input) {
      token
      user {
        id
        ...CurrentUser
      }
    }
  }

  ${CurrentUserFragmentDoc}
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
  let [searchParams] = useSearchParams()
  const googleCode = searchParams.get('code') || ''
  const { translate } = useInternationalization()
  const [isGoogleRegister, setIsGoogleRegister] = useState<boolean>(!!googleCode)
  const [signUp, { error: signUpError }] = useSignupMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (!!res?.registerUser) {
        onLogIn(res.registerUser.token, res?.registerUser?.user)
      }
    },
  })

  const [googleRegister, { error: googleRegisterError }] = useGoogleRegisterMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (!!res?.googleRegisterUser) {
        onLogIn(res.googleRegisterUser.token, res?.googleRegisterUser?.user)
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
            <Title variant="headline">
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

              <OrSeparator>
                <Typography variant="captionHl" color="grey500">
                  {translate('text_6303351deffd2a0d70498675').toUpperCase()}
                </Typography>
              </OrSeparator>
            </>
          )}

          <InputWrapper>
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
                      {translate('text_620bc4d4269a55014d493fbe')}
                    </ValidPasswordAlert>
                  )}
                </div>
              </>
            )}
          </InputWrapper>

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
  margin-top: ${theme.spacing(4)};
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

export default SignUp
