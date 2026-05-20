import { revalidateLogic } from '@tanstack/react-form'
import { ReactNode } from 'react'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

const CASCADE_FORM_ID = 'cascade-updates-form'

const CascadeUpdatesField = withForm({
  defaultValues: { cascadeUpdates: true },
  render: function Render({ form }) {
    const { translate } = useInternationalization()

    return (
      <form.AppField name="cascadeUpdates">
        {(field) => (
          <field.SwitchField
            label={translate('text_1779289915866s3gisblcite')}
            subLabel={translate('text_1779289915866itrqeyj7658')}
          />
        )}
      </form.AppField>
    )
  },
})

type OpenCascadeDialogInput = {
  title: ReactNode
  description?: ReactNode
  mainActionLabel: string
  hasOverriddenPlans: boolean
  onConfirm: (cascadeUpdates: boolean) => Promise<void> | void
  danger?: boolean
}

type SubmitMeta = {
  onConfirm: OpenCascadeDialogInput['onConfirm']
}

export const useCascadeFormDialog = () => {
  const formDialog = useFormDialog()

  const form = useAppForm({
    defaultValues: { cascadeUpdates: true },
    validationLogic: revalidateLogic(),
    onSubmitMeta: {} as SubmitMeta,
    onSubmit: async ({ value, meta }) => {
      await meta.onConfirm(value.cascadeUpdates)
    },
  })

  const openCascadeDialog = async (input: OpenCascadeDialogInput) => {
    if (!input.hasOverriddenPlans) {
      await input.onConfirm(false)
      return
    }

    form.reset()

    await formDialog.open({
      title: input.title,
      description: input.description,
      form: {
        id: CASCADE_FORM_ID,
        submit: () => form.handleSubmit({ onConfirm: input.onConfirm }),
      },
      mainAction: (
        <form.AppForm>
          <form.SubmitButton danger={input.danger}>{input.mainActionLabel}</form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <form.AppForm>
          <CascadeUpdatesField form={form} />
        </form.AppForm>
      ),
    })
  }

  return { openCascadeDialog }
}
