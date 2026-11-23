import { revalidateLogic, useStore } from '@tanstack/react-form'

import { PasswordValidationHints } from '~/components/form/PasswordValidationHints/PasswordValidationHints'
import { TextInput } from '~/components/form/TextInput'
import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { usePasswordValidation } from '~/hooks/forms/usePasswordValidation'

import { InvitationFormProps } from './types'
import { invitationDefaultValues, invitationValidationSchema } from './validationSchema'

export const InvitationSignUpForm = ({
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
      onDynamic: invitationValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.password)
    },
  })

  const password = useStore(form.store, (state) => state.values.password)
  const passwordValidation = usePasswordValidation(password)

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

          <div>
            <form.AppField name="password">
              {(field) => (
                <field.TextInputField
                  password
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
              successMessage="text_63246f875e2228ab7b63dd02"
            />
          </div>
        </div>

        <form.AppForm>
          <form.SubmitButton dataTest={submitDataTest} fullWidth size="large" loading={loading}>
            {translate('text_63246f875e2228ab7b63dd1c')}
          </form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  )
}
