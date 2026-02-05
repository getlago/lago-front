import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const MAX_CHAR_LIMIT = 255

type EditInvoiceItemDescriptionDialogProps = {
  description?: string
  callback: (description: string) => void
}

export interface EditInvoiceItemDescriptionDialogRef {
  openDialog: (data: EditInvoiceItemDescriptionDialogProps) => unknown
  closeDialog: () => unknown
}

export const EditInvoiceItemDescriptionDialog = forwardRef<EditInvoiceItemDescriptionDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [data, setData] = useState<EditInvoiceItemDescriptionDialogProps>()

    const formikProps = useFormik<Omit<EditInvoiceItemDescriptionDialogProps, 'callback'>>({
      initialValues: {
        description: data?.description || undefined,
      },
      validationSchema: object().shape({
        description: string().max(MAX_CHAR_LIMIT, 'text_6453819268763979024ad029'),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: (values, formikBag) => {
        !!values.description && data?.callback(values.description)

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
        title={translate('text_6453819268763979024acff7')}
        description={translate('text_6453819268763979024ad005')}
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
              {translate('text_6453819268763979024ad041')}
            </Button>
          </>
        )}
      >
        <TextInputField
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          multiline
          name="description"
          className="mb-8 whitespace-pre-line"
          rows="3"
          label={translate('text_6453819268763979024ad011')}
          error={formikProps.errors.description}
          formikProps={formikProps}
          helperText={
            <div className="flex justify-between">
              <div className="flex-1">
                {!!formikProps.errors?.description
                  ? translate('text_6453819268763979024ad029')
                  : translate('text_64539c4583bc9200f203b11d')}
              </div>
              <div className="shrink-0">
                {(formikProps.values?.description || '').length}/{MAX_CHAR_LIMIT}
              </div>
            </div>
          }
        />
      </Dialog>
    )
  },
)

EditInvoiceItemDescriptionDialog.displayName = 'forwardRef'
