import { Alert } from '~/components/designSystem/Alert'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { RecaptchaNotice } from '~/pages/auth/common/RecaptchaNotice'
import {
  SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID,
  SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID,
} from '~/pages/auth/signUpTestIds'
import { verifyEmailDefaultValues } from '~/pages/auth/verifyEmailForm/validationSchema'
import { Title } from '~/styles/auth'

type VerifyEmailConfirmFormProps = {
  email: string | undefined
  isPasswordRequired: boolean
  bannerError: string | undefined
  passwordError: string | undefined
  onPasswordChange: () => void
}

const verifyEmailConfirmFormDefaultProps: VerifyEmailConfirmFormProps = {
  email: undefined,
  isPasswordRequired: false,
  bannerError: undefined,
  passwordError: undefined,
  onPasswordChange: () => undefined,
}

export const VerifyEmailConfirmForm = withForm({
  defaultValues: verifyEmailDefaultValues,
  props: verifyEmailConfirmFormDefaultProps,
  render: function VerifyEmailConfirmFormRender({
    form,
    email,
    isPasswordRequired,
    bannerError,
    passwordError,
    onPasswordChange,
  }) {
    const { translate } = useInternationalization()

    const handleSubmit = (event: React.FormEvent): void => {
      event.preventDefault()
      form.handleSubmit()
    }

    return (
      <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">
          <Title>{translate('text_1793909885493jz6i6ilc960')}</Title>
          <Typography html={translate('text_1793909885493052npdnakq9', { email })} />
        </div>

        {!!bannerError && (
          <Alert type="danger" data-test={SELF_SERVE_SIGNUP_ERROR_ALERT_TEST_ID}>
            {translate(bannerError)}
          </Alert>
        )}

        {isPasswordRequired && (
          <form.AppField name="password" listeners={{ onChange: onPasswordChange }}>
            {(field) => (
              <field.TextInputField
                password
                label={translate('text_620bc4d4269a55014d493f32')}
                placeholder={translate('text_620bc4d4269a55014d493f5b')}
                helperText={translate('text_1793909885494lhzg2ru6vty')}
                errorOverride={passwordError ? translate(passwordError) : undefined}
                data-test={SELF_SERVE_VERIFY_EMAIL_PASSWORD_FIELD_TEST_ID}
              />
            )}
          </form.AppField>
        )}

        <div className="flex flex-col gap-4">
          <form.AppForm>
            <form.SubmitButton
              dataTest={SELF_SERVE_VERIFY_EMAIL_CONFIRM_BUTTON_TEST_ID}
              size="large"
              fullWidth
            >
              {translate('text_1793909885493zizmilfx6tn')}
            </form.SubmitButton>
          </form.AppForm>
          {isPasswordRequired && <RecaptchaNotice />}
        </div>
      </form>
    )
  },
})
