import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { InputMaybe } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type EditInvoiceDisplayNameDialogProps = {
  invoiceDisplayName: InputMaybe<string> | undefined
  callback: (invoiceDisplayName: string) => void
}

export interface EditInvoiceDisplayNameDialogRef {
  openDialog: (data: EditInvoiceDisplayNameDialogProps) => unknown
  closeDialog: () => unknown
}

export const EditInvoiceDisplayNameDialog = forwardRef<EditInvoiceDisplayNameDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [data, setData] = useState<EditInvoiceDisplayNameDialogProps>()

    const formikProps = useFormik<Omit<EditInvoiceDisplayNameDialogProps, 'callback'>>({
      initialValues: {
        invoiceDisplayName: data?.invoiceDisplayName || '',
      },
      validationSchema: object().shape({
        invoiceDisplayName: string(),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values, formikBag) => {
        data?.callback(values.invoiceDisplayName || '')

        dialogRef?.current?.closeDialog()
        formikBag.resetForm()
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (datas) => {
        setData(datas)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate('text_65018c8e5c6b626f030bcf1e')}
        description={translate('text_65018c8e5c6b626f030bcf22')}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate('text_65018c8e5c6b626f030bcf32')}
            </Button>
          </>
        )}
      >
        <TextInputField
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          cleanable
          className="mb-8"
          name="invoiceDisplayName"
          label={translate('text_65018c8e5c6b626f030bcf26')}
          placeholder={translate('text_65018c8e5c6b626f030bcf2a')}
          error={formikProps.errors.invoiceDisplayName}
          formikProps={formikProps}
        />
      </Dialog>
    )
  },
)

EditInvoiceDisplayNameDialog.displayName = 'EditInvoiceDisplayNameDialog'
