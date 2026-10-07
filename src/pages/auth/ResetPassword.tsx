import { gql, useApolloClient } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useParams } from 'react-router'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { TextInput } from '~/components/form'
import { PasswordValidationHints } from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import { addToast, onLogIn } from '~/core/apolloClient'
import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'
import {
  LagoApiError,
  useGetPasswordResetQuery,
  useResetPasswordMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePasswordValidation } from '~/hooks/forms/usePasswordValidation'
import { Card, Page, StyledLogo, Subtitle, Title } from '~/styles/auth'

import {
  resetPasswordDefaultValues,
  resetPasswordValidationSchema,
} from './resetPasswordForm/validationSchema'

const RESET_PASSWORD_FORM_ID = 'reset-password-form'

// `scripts/translations/inspect.js` only sees keys passed to `translate()` or written
// between single quotes, so inlining this one as a JSX attribute reports it as unused.
const PASSWORD_SUCCESS_MESSAGE_KEY = 'text_63246f875e2228ab7b63dd02'

export const RESET_PASSWORD_EMAIL_FIELD_TEST_ID = 'reset-password-email-field'
export const RESET_PASSWORD_PASSWORD_FIELD_TEST_ID = 'reset-password-password-field'
export const RESET_PASSWORD_SUBMIT_BUTTON_TEST_ID = 'reset-password-submit-button'

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
    }
  }
`

const ResetPassword = () => {
  const { translate } = useInternationalization()
  const { token } = useParams()
  const client = useApolloClient()

  const { data, loading, error } = useGetPasswordResetQuery({
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: !token,
    variables: { token: token || '' },
  })

  const [resetPassword] = useResetPasswordMutation({
    onCompleted: async (res) => {
      if (!!res?.resetPassword) {
        await onLogIn(client, res?.resetPassword.token)
      } else {
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })
  const email = data?.passwordReset?.user?.email || ''

  const form = useAppForm({
    defaultValues: resetPasswordDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: resetPasswordValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await resetPassword({
        variables: {
          input: {
            token: token || '',
            newPassword: value.password,
          },
        },
      })
    },
  })

  const password = useStore(form.store, (state) => state.values.password)
  const passwordValidation = usePasswordValidation(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        {!!loading && !error && (
          <>
            <Skeleton variant="text" className="mb-8 w-52" />
            <Skeleton variant="text" className="mb-4 w-110" />
            <Skeleton variant="text" className="w-76" />
          </>
        )}
        {!!error && !loading && (
          <>
            <Title>{translate('text_642707b0da1753a9bb667292')}</Title>
            <Subtitle noMargins>{translate('text_642707b0da1753a9bb66729c')}</Subtitle>
          </>
        )}
        {!loading && !error && (
          <>
            <Title>{translate('text_642707b0da1753a9bb667290')}</Title>
            <Subtitle>{translate('text_642707b0da1753a9bb66729a')}</Subtitle>

            <form id={RESET_PASSWORD_FORM_ID} onSubmit={handleSubmit}>
              <TextInput
                disabled
                className="mb-4"
                name="email"
                data-test={RESET_PASSWORD_EMAIL_FIELD_TEST_ID}
                beforeChangeFormatter={['lowercase']}
                label={translate('text_63246f875e2228ab7b63dcdc')}
                value={email}
              />

              <div className="mb-8">
                <form.AppField name="password">
                  {(field) => (
                    <field.TextInputField
                      password
                      data-test={RESET_PASSWORD_PASSWORD_FIELD_TEST_ID}
                      label={translate('text_63246f875e2228ab7b63dce9')}
                      placeholder={translate('text_63246f875e2228ab7b63dcf0')}
                      showOnlyErrors={[PASSWORD_VALIDATION_ERRORS.REQUIRED]}
                    />
                  )}
                </form.AppField>
                <PasswordValidationHints
                  password={password}
                  errors={passwordValidation.errors}
                  isValid={passwordValidation.isValid}
                  successMessage={PASSWORD_SUCCESS_MESSAGE_KEY}
                />
              </div>

              <div className="mb-8">
                <form.AppForm>
                  <form.SubmitButton
                    dataTest={RESET_PASSWORD_SUBMIT_BUTTON_TEST_ID}
                    fullWidth
                    size="large"
                  >
                    {translate('text_642707b0da1753a9bb6672c4')}
                  </form.SubmitButton>
                </form.AppForm>
              </div>
            </form>
          </>
        )}
      </Card>
    </Page>
  )
}

export default ResetPassword
