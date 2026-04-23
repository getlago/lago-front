import { gql, useMutation } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { object, string } from 'yup'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { TextInputField } from '~/components/form'
import {
  AdminRole,
  updateAdminAuthTokenVar,
  updateAdminEmailVar,
  updateAdminRoleVar,
} from '~/core/apolloClient/reactiveVars/adminAuthTokenVar'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import Logo from '~/public/images/logo/lago-logo.svg'

import { ADMIN_PORTAL_ROUTE } from './routes'

const ADMIN_LOGIN_MUTATION = gql`
  mutation adminLoginUser($input: AdminLoginUserInput!) {
    adminLoginUser(input: $input) {
      token
      role
      allowedIntegrations
      reasonCategories
    }
  }
`

interface AdminLoginResult {
  adminLoginUser: {
    token: string
    role: string
    allowedIntegrations: string[]
    reasonCategories: string[]
  }
}

interface AdminLoginVars {
  input: {
    email: string
    password: string
  }
}

type AdminLoginError = 'not_staff_member' | 'incorrect_login_or_password' | null

const AdminLogin = () => {
  const navigate = useNavigate()
  const { isAdminAuthenticated } = useIsAdminAuthenticated()
  const [loginError, setLoginError] = useState<AdminLoginError>(null)

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate(ADMIN_PORTAL_ROUTE, { replace: true })
    }
  }, [isAdminAuthenticated, navigate])

  const [adminLogin, { loading }] = useMutation<AdminLoginResult, AdminLoginVars>(
    ADMIN_LOGIN_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.adminLoginUser?.token) {
          updateAdminAuthTokenVar(data.adminLoginUser.token)
          updateAdminRoleVar(data.adminLoginUser.role as AdminRole)
          navigate(ADMIN_PORTAL_ROUTE, { replace: true })
        }
      },
      onError: (error) => {
        const gqlError = error.graphQLErrors?.[0]
        const code = gqlError?.extensions?.code as string

        if (code === 'not_staff_member') {
          setLoginError('not_staff_member')
        } else {
          setLoginError('incorrect_login_or_password')
        }
      },
    },
  )

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
      setLoginError(null)
      updateAdminEmailVar(values.email)
      await adminLogin({
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
    <div className="flex min-h-screen flex-col bg-grey-100">
      <div className="p-8">
        <Logo height={24} />
      </div>

      <div className="flex flex-1 items-start justify-center pt-20 md:items-center md:pt-0">
        <div className="w-full max-w-144 rounded-xl bg-white p-10 shadow-md">
          <div className="mb-8 flex flex-col gap-3">
            <Typography variant="headline">Admin Portal</Typography>
            <Typography>Sign in to access the admin portal.</Typography>
          </div>

          {loginError === 'incorrect_login_or_password' && (
            <Alert className="mb-8" type="danger">
              Incorrect email or password. Please try again.
            </Alert>
          )}

          {loginError === 'not_staff_member' && (
            <Alert className="mb-8" type="danger">
              This account is not authorized to access the admin portal.
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <TextInputField
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              name="email"
              beforeChangeFormatter={['lowercase']}
              formikProps={formikProps}
              label="Email"
              placeholder="name@example.com"
            />
            <TextInputField
              name="password"
              formikProps={formikProps}
              password
              label="Password"
              placeholder="Enter your password"
            />
          </div>

          <Button
            className="mt-8"
            data-test="admin-submit"
            fullWidth
            size="large"
            disabled={loading}
            onClick={formikProps.submitForm}
          >
            {loading ? 'Signing in...' : 'Log in'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
