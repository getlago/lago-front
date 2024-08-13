import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { generatePath, Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import GoogleAuthButton from '~/components/auth/GoogleAuthButton'
import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { envGlobalVar, hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { FORGOT_PASSWORD_ROUTE, LOGIN_OKTA, SIGN_UP_ROUTE } from '~/core/router'
import { CurrentUserFragmentDoc, LagoApiError, useLoginUserMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { useSalesForceConfig } from '~/hooks/useSalesForceConfig'
import { theme } from '~/styles'
import { Card, Page, StyledLogo } from '~/styles/auth'

const { disableSignUp } = envGlobalVar()

gql`
  mutation loginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      user {
        id
        ...CurrentUser
      }
      token
    }
  }

  ${CurrentUserFragmentDoc}
`

const Login = () => {
  const { translate } = useInternationalization()
  const { isRunningInSalesForceIframe } = useSalesForceConfig()
  const navigate = useNavigate()

  const [loginUser, { error: loginError }] = useLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (!!res?.loginUser) {
        onLogIn(res.loginUser.token, res?.loginUser?.user)
      }
    },
    fetchPolicy: 'network-only',
  })

  const formikProps = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: object().shape({
      email: string()
        .email('text_620bc4d4269a55014d493fc3')
        .required('text_620bc4d4269a55014d493f98'),
      password: string().required('text_620bc4d4269a55014d493fb3'),
    }),
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      await loginUser({
        variables: {
          input: {
            email: values.email,
            password: values.password,
          },
        },
      })
    },
  })

  useShortcuts([
    {
      keys: ['Enter'],
      action: formikProps.submitForm,
    },
  ])

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <Stack spacing={8}>
          <Stack spacing={3}>
            <Typography variant="headline">{translate('text_620bc4d4269a55014d493f08')}</Typography>
            <Typography>{translate('text_620bc4d4269a55014d493f81')}</Typography>
          </Stack>

          {hasDefinedGQLError('IncorrectLoginOrPassword', loginError) && (
            <Alert data-test="error-alert" type="danger">
              {translate('text_620bc4d4269a55014d493fb7')}
            </Alert>
          )}

          {!isRunningInSalesForceIframe && (
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
                  onClick={() => navigate(LOGIN_OKTA)}
                >
                  {translate('text_664c90c9b2b6c2012aa50bce')}
                </Button>
              </Stack>

              <OrSeparator>
                <Typography variant="captionHl" color="grey500">
                  {translate('text_6303351deffd2a0d70498675').toUpperCase()}
                </Typography>
              </OrSeparator>
            </>
          )}

          <InputWrapper>
            <TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              name="email"
              beforeChangeFormatter={['lowercase']}
              formikProps={formikProps}
              label={translate('text_62ab2d0396dd6b0361614d60')}
              placeholder={translate('text_62a99ba2af7535cefacab4bf')}
            />

            <PasswordInputWrapper>
              <TextInputField
                name="password"
                formikProps={formikProps}
                password
                label={translate('text_620bc4d4269a55014d493f32')}
                placeholder={translate('text_620bc4d4269a55014d493f5b')}
              />
              <PasswordForgottenLinkTypo variant="caption">
                <Link to={generatePath(FORGOT_PASSWORD_ROUTE)}>
                  {translate('text_642707b0da1753a9bb6672b5')}
                </Link>
              </PasswordForgottenLinkTypo>
            </PasswordInputWrapper>
          </InputWrapper>

          <Button data-test="submit" fullWidth size="large" onClick={formikProps.submitForm}>
            {translate('text_620bc4d4269a55014d493f6d')}
          </Button>

          {!disableSignUp && !isRunningInSalesForceIframe && (
            <UsefullLink
              variant="caption"
              html={translate('text_62c84d0029355c83db4dd186', {
                linkSignUp: SIGN_UP_ROUTE,
              })}
            />
          )}
        </Stack>
      </Card>
    </Page>
  )
}

export default Login

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

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const PasswordInputWrapper = styled.div`
  position: relative;
`
const PasswordForgottenLinkTypo = styled(Typography)`
  position: absolute;
  top: 0;
  right: 0;
`

const UsefullLink = styled(Typography)`
  margin-left: auto;
  margin-right: auto;
  text-align: center;
`
