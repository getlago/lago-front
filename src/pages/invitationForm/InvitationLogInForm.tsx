import { revalidateLogic } from '@tanstack/react-form'

import { TextInput } from '~/components/form/TextInput'
import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { InvitationFormProps } from './types'
import { invitationDefaultValues, invitationLogInValidationSchema } from './validationSchema'

/**
 * Acceptance of an invitation whose email already has an account. The password is verified against
 * that account. Users whose memberships were all revoked cannot log in anymore, so acceptance is
 * not delegated to the login page.
 */
export const InvitationLogInForm = ({
  email,
  formId,
  loading,
  submitDataTest,
  onSubmit,
}: InvitationFormProps) => {
  const { translate } = useInternationalization()

  const form = useAppForm({
    defaultValues: invitationDefaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: invitationLogInValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.password)
    },
  })

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <TextInput
            disabled
            name="email"
            beforeChangeFormatter={['lowercase']}
            label={translate('text_63246f875e2228ab7b63dcdc')}
            value={email}
          />

          <form.AppField name="password">
            {(field) => (
              <field.TextInputField
                password
                label={translate('text_620bc4d4269a55014d493f32')}
                placeholder={translate('text_620bc4d4269a55014d493f5b')}
                showOnlyErrors={[PASSWORD_VALIDATION_ERRORS.REQUIRED]}
              />
            )}
          </form.AppField>
        </div>

        <form.AppForm>
          <form.SubmitButton dataTest={submitDataTest} fullWidth size="large" loading={loading}>
            {translate('text_1786557508910towzrwnae9w')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  )
}
