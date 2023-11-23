import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

const MAX_CHAR_LIMIT = 255

type EditInvoiceItemDescriptionDialogProps = {
  description?: string
  callback: Function
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
      onSubmit: async (values, formikBag) => {
        await data?.callback(values.description)

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
        <TextArea
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          multiline
          name="description"
          rows="3"
          label={translate('text_6453819268763979024ad011')}
          error={formikProps.errors.description}
          formikProps={formikProps}
          helperText={
            <TextInputHelper>
              <div>
                {!!formikProps.errors?.description
                  ? translate('text_6453819268763979024ad029')
                  : translate('text_64539c4583bc9200f203b11d')}
              </div>
              <div>
                {(formikProps.values?.description || '').length}/{MAX_CHAR_LIMIT}
              </div>
            </TextInputHelper>
          }
        />
      </Dialog>
    )
  },
)

EditInvoiceItemDescriptionDialog.displayName = 'forwardRef'

const TextArea = styled(TextInputField)`
  margin-bottom: ${theme.spacing(8)};

  textarea:first-child {
    white-space: pre-line;
  }
`

const TextInputHelper = styled.div`
  display: flex;
  justify-content: space-between;

  > div:first-child {
    flex: 1;
  }

  > div:last-child {
    flex-shrink: 0;
  }
`
