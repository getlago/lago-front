import { gql } from '@apollo/client'
import _findKey from 'lodash/findKey'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Alert, Button, Skeleton, Typography } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { addToast, onLogIn } from '~/core/apolloClient'
import {
  CurrentUserFragmentDoc,
  LagoApiError,
  useGetPasswordResetQuery,
  useResetPasswordMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

gql`
  query getPasswordReset($token: String!) {
    passwordReset(token: $token) {
      id
      user {
        id
        email
      }
    }
  }

  mutation resetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
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

const ResetPassword = () => {
  const { translate } = useInternationalization()
  const { token } = useParams()
  const { data, error, loading } = useGetPasswordResetQuery({
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: !token,
    variables: { token: token || '' },
  })
  const [resetPassword] = useResetPasswordMutation({
    onCompleted(res) {
      if (!!res?.resetPassword) {
        onLogIn(res?.resetPassword.token, res?.resetPassword?.user)
      } else {
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })
  const email = data?.passwordReset?.user?.email || ''

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
  const onResetPassword = async () => {
    const { password } = formFields

    await resetPassword({
      variables: {
        input: {
          token: token || '',
          newPassword: password,
        },
      },
    })
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
      action: onResetPassword,
    },
  ])

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        {!!loading && !error ? (
          <>
            <Skeleton variant="text" width={208} height={12} marginBottom={theme.spacing(8)} />
            <Skeleton variant="text" width={440} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={304} height={12} />
          </>
        ) : !!error && !loading ? (
          <>
            <Title variant="headline">{translate('text_642707b0da1753a9bb667292')}</Title>
            <Subtitle $noMargins>{translate('text_642707b0da1753a9bb66729c')}</Subtitle>
          </>
        ) : (
          <>
            <Title variant="headline">{translate('text_642707b0da1753a9bb667290')}</Title>
            <Subtitle>{translate('text_642707b0da1753a9bb66729a')}</Subtitle>

            <form>
              <Input
                disabled
                name="email"
                beforeChangeFormatter={['lowercase']}
                label={translate('text_63246f875e2228ab7b63dcdc')}
                value={email}
              />

              <PasswordBlock>
                <TextInput
                  name="password"
                  value={formFields.password}
                  password
                  onChange={(value) => setFormFields((prev) => ({ ...prev, password: value }))}
                  label={translate('text_63246f875e2228ab7b63dce9')}
                  placeholder={translate('text_63246f875e2228ab7b63dcf0')}
                />
                <PasswordValidation $visible={!!formFields.password}>
                  {errors.some((err) => PASSWORD_VALIDATION.includes(err)) ? (
                    PASSWORD_VALIDATION.map((err) => {
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
                    })
                  ) : (
                    <StyledAlert type="success" data-test="success">
                      {translate('text_63246f875e2228ab7b63dd02')}
                    </StyledAlert>
                  )}
                </PasswordValidation>
              </PasswordBlock>

              <SubmitButton
                data-test="submit-button"
                disabled={errors.length > 0}
                fullWidth
                size="large"
                onClick={onResetPassword}
              >
                {translate('text_642707b0da1753a9bb6672c4')}
              </SubmitButton>
            </form>
          </>
        )}
      </Card>
    </Page>
  )
}

const Input = styled(TextInput)`
  && {
    margin-bottom: ${theme.spacing(4)};
  }
`

const PasswordBlock = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const PasswordValidation = styled.div<{ $visible: boolean }>`
  margin-top: ${theme.spacing(4)};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: '500px';
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
`

const StyledAlert = styled(Alert)`
  flex: 1;
  margin-bottom: ${theme.spacing(3)};
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

const SubmitButton = styled(Button)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

export default ResetPassword
