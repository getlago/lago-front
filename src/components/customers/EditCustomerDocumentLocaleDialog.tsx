import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { documentLocalesDataForComboBox } from '~/core/translations/documentLocales'
import {
  EditCustomerDocumentLocaleFragment,
  UpdateCustomerInput,
  useUpdateCustomerDocumentLocaleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment EditCustomerDocumentLocale on Customer {
    id
    name
    displayName
    externalId
    billingConfiguration {
      id
      documentLocale
    }
  }

  mutation updateCustomerDocumentLocale($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      billingConfiguration {
        id
        documentLocale
      }
    }
  }
`
export type EditCustomerDocumentLocaleDialogRef = DialogRef

interface EditCustomerDocumentLocaleDialogProps {
  customer: EditCustomerDocumentLocaleFragment
}

export const EditCustomerDocumentLocaleDialog = forwardRef<
  DialogRef,
  EditCustomerDocumentLocaleDialogProps
>(({ customer }: EditCustomerDocumentLocaleDialogProps, ref) => {
  const { translate } = useInternationalization()
  const isEdition = !!customer.billingConfiguration?.documentLocale
  const customerName = customer?.displayName
  const [updateDocumentLocale] = useUpdateCustomerDocumentLocaleMutation({
    onCompleted(res) {
      if (res.updateCustomer) {
        addToast({
          severity: 'success',
          translateKey: isEdition
            ? 'text_63ea0f84f400488553caa76f'
            : 'text_63ea0f84f400488553caa77b',
        })
      }
    },
  })
  const formikProps = useFormik<Pick<UpdateCustomerInput, 'billingConfiguration'>>({
    initialValues: {
      billingConfiguration: {
        documentLocale: customer.billingConfiguration?.documentLocale,
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
            id: customer.id,
            ...values,
            // NOTE: API should not require those fields on customer update
            // To be tackled as improvement
            externalId: customer.externalId,
            name: customer.name || '',
          },
        },
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate(
        isEdition ? 'text_63ea0f84f400488553caa65c' : 'text_63ea0f84f400488553caa678',
      )}
      description={
        <Typography
          html={translate('text_63ea0f84f400488553caa680', {
            customerName: `<span class="line-break-anywhere">${customerName}</span>`,
          })}
        />
      }
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63ea0f84f400488553caa6a5')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {isEdition
              ? translate('text_63ea0f84f400488553caa681')
              : translate('text_63ea0f84f400488553caa6ad')}
          </Button>
        </>
      )}
    >
      <div className="mb-8">
        <ComboBoxField
          disableClearable
          name="billingConfiguration.documentLocale"
          label={translate('text_63ea0f84f400488553caa687')}
          placeholder={translate('text_63ea0f84f400488553caa68f')}
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

EditCustomerDocumentLocaleDialog.displayName = 'forwardRef'
