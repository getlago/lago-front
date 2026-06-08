import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Dialog, DialogRef } from '~/components/designSystem/Dialog'
import { InputMaybe } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type EditInvoiceDisplayNameDialogProps = {
  invoiceDisplayName: InputMaybe<string> | undefined
  callback: (invoiceDisplayName: string) => void
}

export interface EditInvoiceDisplayNameDialogRef {
  openDialog: (data: EditInvoiceDisplayNameDialogProps) => unknown
  closeDialog: () => unknown
}

const editInvoiceDisplayNameSchema = z.object({
  invoiceDisplayName: z.string(),
})

export const EditInvoiceDisplayNameDialog = forwardRef<EditInvoiceDisplayNameDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [data, setData] = useState<EditInvoiceDisplayNameDialogProps>()

    const form = useAppForm({
      defaultValues: {
        invoiceDisplayName: (data?.invoiceDisplayName ?? '') as string,
      },
      validationLogic: revalidateLogic(),
      validators: {
        onDynamic: editInvoiceDisplayNameSchema,
      },
      onSubmit: async ({ value }) => {
        data?.callback(value.invoiceDisplayName ?? '')
        dialogRef.current?.closeDialog()
      },
    })

    const isDirty = useStore(form.store, (state) => state.isDirty)

    useImperativeHandle(ref, () => ({
      openDialog: (datas) => {
        setData(datas)
        form.reset({ invoiceDisplayName: datas?.invoiceDisplayName ?? '' })
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <form.AppForm>
        <Dialog
          ref={dialogRef}
          title={translate('text_65018c8e5c6b626f030bcf1e')}
          description={translate('text_65018c8e5c6b626f030bcf22')}
          formId="edit-invoice-display-name-dialog"
          formSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          onClose={() => form.reset()}
          actions={({ closeDialog }) => (
            <>
              <Button variant="quaternary" onClick={closeDialog}>
                {translate('text_63eba8c65a6c8043feee2a14')}
              </Button>
              <form.SubmitButton disabled={!isDirty}>
                {translate('text_65018c8e5c6b626f030bcf32')}
              </form.SubmitButton>
            </>
          )}
        >
          <form.AppField name="invoiceDisplayName">
            {(field) => (
              <field.TextInputField
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                cleanable
                className="mb-8"
                label={translate('text_65018c8e5c6b626f030bcf26')}
                placeholder={translate('text_65018c8e5c6b626f030bcf2a')}
              />
            )}
          </form.AppField>
        </Dialog>
      </form.AppForm>
    )
  },
)

EditInvoiceDisplayNameDialog.displayName = 'EditInvoiceDisplayNameDialog'
