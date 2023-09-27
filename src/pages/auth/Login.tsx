import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { generatePath, Link } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Alert, Button, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { envGlobalVar, hasDefinedGQLError, onLogIn } from '~/core/apolloClient'
import { FORGOT_PASSWORD_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { CurrentUserFragmentDoc, LagoApiError, useLoginUserMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

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
  const [login, { error: loginError }] = useLoginUserMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (!!res?.loginUser) {
        onLogIn(res.loginUser.token, res?.loginUser?.user)
      }
    },
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
      await login({
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
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f08')}</Title>
        <Subtitle>{translate('text_620bc4d4269a55014d493f81')}</Subtitle>

        {hasDefinedGQLError('IncorrectLoginOrPassword', loginError) && (
          <ErrorAlert data-test="error-alert" type="danger">
            {translate('text_620bc4d4269a55014d493fb7')}
          </ErrorAlert>
        )}

        <form>
          <EmailInput
            name="email"
            beforeChangeFormatter={['lowercase']}
            formikProps={formikProps}
            label={translate('text_62a99ba2af7535cefacab4aa')}
            placeholder={translate('text_62a99ba2af7535cefacab4bf')}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />

          <PasswordInputWrapper>
            <PasswordInput
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

          <SubmitButton data-test="submit" fullWidth size="large" onClick={formikProps.submitForm}>
            {translate('text_620bc4d4269a55014d493f6d')}
          </SubmitButton>
        </form>

        {!disableSignUp && (
          <UsefullLink
            variant="caption"
            html={translate('text_62c84d0029355c83db4dd186', {
              linkSignUp: SIGN_UP_ROUTE,
            })}
          />
        )}
      </Card>
    </Page>
  )
}

export default Login

const EmailInput = styled(TextInputField)`
  && {
    margin-bottom: ${theme.spacing(4)};
  }
`

const PasswordInputWrapper = styled.div`
  position: relative;
`
const PasswordForgottenLinkTypo = styled(Typography)`
  position: absolute;
  top: 0;
  right: 0;
`

const PasswordInput = styled(TextInputField)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SubmitButton = styled(Button)`
  && {
    margin-bottom: ${theme.spacing(4)};
  }
`

const UsefullLink = styled(Typography)`
  && {
    margin: auto;
    text-align: center;
  }
`

const ErrorAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`
