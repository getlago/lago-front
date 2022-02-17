import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string } from 'yup'
import { useFormik } from 'formik'
import { Link } from 'react-router-dom'

import { theme } from '~/styles'
import Logo from '~/public/images/logo/lago-logo.svg'
import { Typography, Button, Alert } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { useLoginUserMutation } from '~/generated/graphql'
import { onLogIn } from '~/core/apolloClient'
import { TextInputField } from '~/components/form'

gql`
  mutation loginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      user {
        id
      }
      token
    }
  }
`

const Login = () => {
  const { translate } = useI18nContext()
  const [login, { error: loginError }] = useLoginUserMutation({
    context: { silentError: true },
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
        .email('text_618e691cc485410141d5988b')
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

  // {!!loginError?.graphQLErrors &&
  //   (loginError?.graphQLErrors[0] as LagoGQLError)?.code === LagoError.WrongLoginCombo && (
  //     <ErrorAlert type="danger">{translate('text_6183dbff7cbe92012be6aaf9')}</ErrorAlert>
  //   )} TODO

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />
        <Title variant="headline">{translate('text_620bc4d4269a55014d493f08')}</Title>
        <Subtitle>{translate('text_620bc4d4269a55014d493f81')}</Subtitle>

        {!!loginError?.graphQLErrors && loginError?.graphQLErrors[0] && (
          <ErrorAlert type="danger">{translate('text_620bc4d4269a55014d493fb7')}</ErrorAlert>
        )}

        <EmailInput
          name="email"
          formikProps={formikProps}
          label={translate('text_620bc4d4269a55014d493f1e')}
          placeholder={translate('text_620bc4d4269a55014d493f49')}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <PasswordInput
          name="password"
          formikProps={formikProps}
          password
          label={translate('text_620bc4d4269a55014d493f32')}
          placeholder={translate('text_620bc4d4269a55014d493f5b')}
        />

        <SubmitButton fullWidth size="large" onClick={formikProps.submitForm}>
          {translate('text_620bc4d4269a55014d493f6d')}
        </SubmitButton>

        <ForgotPassword to="TODO">{translate('text_620bc4d4269a55014d493f93')}</ForgotPassword>
      </Card>
    </Page>
  )
}

export default Login

const Page = styled.div`
  box-sizing: border-box;
  background-color: ${theme.palette.grey[100]};
  min-height: 100vh;
  padding: ${theme.spacing(20)};
`

const Card = styled.div`
  margin: 0 auto;
  background-color: ${theme.palette.background.paper};
  border-radius: 12px;
  box-shadow: 0px 6px 8px 0px #19212e1f; // TODO
  padding: ${theme.spacing(10)};
  max-width: 576px;
`

const StyledLogo = styled(Logo)`
  margin-bottom: ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`
const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

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

const ForgotPassword = styled(Link)`
  && {
    margin: auto;
    text-align: center;
  }
`

const ErrorAlert = styled(Alert)`
  margin-bottom: ${theme.spacing(8)};
`
