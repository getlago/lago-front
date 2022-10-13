import { useState, useMemo, useEffect } from 'react'
import { gql } from '@apollo/client'
import { object, string } from 'yup'
import styled from 'styled-components'
import _findKey from 'lodash/findKey'
import { useParams } from 'react-router-dom'

import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'
import { Typography, Alert, Button, Skeleton } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { TextInput } from '~/components/form'
import { LOGIN_ROUTE } from '~/core/router'
import {
  useAcceptInviteMutation,
  CurrentUserFragmentDoc,
  LagoApiError,
  useGetinviteQuery,
} from '~/generated/graphql'
import { onLogIn, hasDefinedGQLError } from '~/core/apolloClient'
import { useShortcuts } from '~/hooks/ui/useShortcuts'

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
  const { translate } = useInternationalization()
  const { token } = useParams()
  const { data, error, loading } = useGetinviteQuery({
    context: { silentErrorCodes: [LagoApiError.InviteNotFound] },
    variables: { token: token || '' },
  })
  const email = data?.invite?.email
  const [acceptInvite, { error: acceptInviteError }] = useAcceptInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UserAlreadyExists] },
    onCompleted(res) {
      if (!!res?.acceptInvite) {
        onLogIn(res?.acceptInvite.token, res?.acceptInvite.user)
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
    []
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
          <>
            <Title variant="headline">
              {translate('text_63246f875e2228ab7b63dcd0', {
                orgnisationName: data?.invite?.organization.name,
              })}
            </Title>
            <Subtitle>{translate('text_63246f875e2228ab7b63dcd4')}</Subtitle>

            {hasDefinedGQLError('UserAlreadyExists', acceptInviteError) && (
              <ErrorAlert type="danger" data-test="error-alert">
                <Typography
                  color="inherit"
                  html={translate('text_622f7a3dc32ce100c46a5131', { link: LOGIN_ROUTE })}
                />
              </ErrorAlert>
            )}
            <form>
              <Input
                disabled
                name="email"
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
                <PasswordValidation
                  data-test={
                    !!formFields.password
                      ? 'password-validation--visible'
                      : 'password-validation--hidden'
                  }
                  $visible={!!formFields.password}
                >
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
                onClick={onInvitation}
              >
                {translate('text_63246f875e2228ab7b63dd1c')}
              </SubmitButton>
            </form>
            <Typography
              variant="caption"
              html={translate('text_63246f875e2228ab7b63dd1f', { link: LOGIN_ROUTE })}
            />
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
  margin-top: ${({ $visible }) => ($visible ? theme.spacing(4) : 0)};
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  max-height: ${({ $visible }) => ($visible ? '500px' : '0px')};
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  margin-bottom: ${({ $visible }) => ($visible ? theme.spacing(3) : 0)};
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

const ErrorAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`

export default Invitation
