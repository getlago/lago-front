import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { documentLocalesDataForComboBox } from '~/core/translations/documentLocales'
import {
  LagoApiError,
  UpdateBillingEntityInput,
  useUpdateDocumentLocaleBillingEntityMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation updateDocumentLocaleBillingEntity($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`
export type EditBillingEntityDocumentLocaleDialogRef = DialogRef

interface EditBillingEntityDocumentLocaleDialogProps {
  id: string
  documentLocale: string
}

export const EditBillingEntityDocumentLocaleDialog = forwardRef<
  DialogRef,
  EditBillingEntityDocumentLocaleDialogProps
>(({ id, documentLocale }: EditBillingEntityDocumentLocaleDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [updateDocumentLocale] = useUpdateDocumentLocaleBillingEntityMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_63e51ef4985f0ebd75c21349',
        })
      }
    },
    refetchQueries: ['getBillingEntitySettings'],
  })

  const formikProps = useFormik<UpdateBillingEntityInput>({
    initialValues: {
      id,
      billingConfiguration: {
        documentLocale,
      },
    },
    validationSchema: object().shape({
      billingConfiguration: object().shape({
        documentLocale: string().required(''),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await updateDocumentLocale({
        variables: {
          input: {
            ...values,
          },
        },
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_63e51ef4985f0ebd75c2130e')}
      description={translate('text_63e51ef4985f0ebd75c2130f')}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63e51ef4985f0ebd75c21313')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_17432414198706rdwf76ek3u')}
          </Button>
        </>
      )}
    >
      <div className="mb-8">
        <ComboBoxField
          disableClearable
          name="billingConfiguration.documentLocale"
          label={translate('text_63e51ef4985f0ebd75c21310')}
          helperText={
            <Typography variant="caption" html={translate('text_63e51ef4985f0ebd75c21312')} />
          }
          formikProps={formikProps}
          data={documentLocalesDataForComboBox}
          PopperProps={{ displayInDialog: true }}
        />
      </div>
    </Dialog>
  )
})

EditBillingEntityDocumentLocaleDialog.displayName = 'forwardRef'
