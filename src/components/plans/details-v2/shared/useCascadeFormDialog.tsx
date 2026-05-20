import { revalidateLogic } from '@tanstack/react-form'
import { ReactNode } from 'react'

import { useFormDialog } from '~/components/dialogs/FormDialog'
import { useAppForm } from '~/hooks/forms/useAppform'

import { CascadeUpdatesField, cascadeUpdatesFieldDefaultValues } from './CascadeUpdatesField'

const CASCADE_FORM_ID = 'cascade-updates-form'

type OpenCascadeDialogInput = {
  title: ReactNode
  description?: ReactNode
  mainActionLabel: string
  planChildrenCount: number
  onConfirm: (cascadeUpdates: boolean) => Promise<void> | void
  danger?: boolean
}

type SubmitMeta = {
  onConfirm: OpenCascadeDialogInput['onConfirm']
}

export const useCascadeFormDialog = () => {
  const formDialog = useFormDialog()

  const form = useAppForm({
    defaultValues: cascadeUpdatesFieldDefaultValues,
    validationLogic: revalidateLogic(),
    onSubmitMeta: {} as SubmitMeta,
    onSubmit: async ({ value, meta }) => {
      await meta.onConfirm(value.cascadeUpdates)
    },
  })

  const openCascadeDialog = async (input: OpenCascadeDialogInput) => {
    if (input.planChildrenCount === 0) {
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
