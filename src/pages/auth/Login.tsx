import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string } from 'yup'
import { useFormik } from 'formik'

import { theme } from '~/styles'
import { Typography, Button, Alert } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLoginUserMutation, Lago_Api_Error, CurrentUserFragmentDoc } from '~/generated/graphql'
import { onLogIn } from '~/core/apolloClient'
import { TextInputField } from '~/components/form'
import { FORGOT_PASSWORD_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { Page, Title, Subtitle, StyledLogo, Card } from '~/styles/auth'
import { useShortcuts } from '~/hooks/ui/useShortcuts'

gql`
  mutation loginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      user {
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
    context: { silentErrorCodes: [Lago_Api_Error.IncorrectLoginOrPassword] },
    onCompleted(res) {
      if (!!res?.loginUser) {
        onLogIn(res.loginUser.token, res.loginUser.user)
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

        {!!loginError?.graphQLErrors &&
          loginError?.graphQLErrors[0] &&
          loginError?.graphQLErrors[0]?.extensions?.code ===
            Lago_Api_Error.IncorrectLoginOrPassword && (
            <ErrorAlert type="danger">{translate('text_620bc4d4269a55014d493fb7')}</ErrorAlert>
          )}
        <form>
          <EmailInput
            name="email"
            formikProps={formikProps}
            label={translate('text_62a99ba2af7535cefacab4aa')}
            placeholder={translate('text_62a99ba2af7535cefacab4bf')}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />

          <PasswordInput
            name="password"
            formikProps={formikProps}
            disableDebounce
            password
            label={translate('text_620bc4d4269a55014d493f32')}
            placeholder={translate('text_620bc4d4269a55014d493f5b')}
          />

          <SubmitButton
            fullWidth
            size="large"
            loading={formikProps.isSubmitting}
            onClick={formikProps.submitForm}
          >
            {translate('text_620bc4d4269a55014d493f6d')}
          </SubmitButton>
        </form>

        <ForgotPassword
          variant="caption"
          html={translate('text_620bc4d4269a55014d493f93', {
            linkForgetPassword: FORGOT_PASSWORD_ROUTE,
            linkSignUp: SIGN_UP_ROUTE,
          })}
        />
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

const PasswordInput = styled(TextInputField)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

const SubmitButton = styled(Button)`
  && {
    margin-bottom: ${theme.spacing(8)};
  }
`

const ForgotPassword = styled(Typography)`
  && {
    margin: auto;
    text-align: center;
    text-align: left;
  }
`

const ErrorAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`
