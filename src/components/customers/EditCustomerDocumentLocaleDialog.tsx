import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { DocumentLocales } from '~/core/translations/documentLocales'
import {
  EditCustomerDocumentLocaleFragment,
  UpdateCustomerInput,
  useUpdateCustomerDocumentLocaleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment EditCustomerDocumentLocale on Customer {
    id
    name
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
export interface EditCustomerDocumentLocaleDialogRef extends DialogRef {}

interface EditCustomerDocumentLocaleDialogProps {
  customer: EditCustomerDocumentLocaleFragment
}

const documentLocalesData: { value: string; label: string }[] = Object.keys(DocumentLocales).map(
  (localeKey) => {
    return {
      value: localeKey,
      label: DocumentLocales[localeKey],
    }
  },
)

export const EditCustomerDocumentLocaleDialog = forwardRef<
  DialogRef,
  EditCustomerDocumentLocaleDialogProps
>(({ customer }: EditCustomerDocumentLocaleDialogProps, ref) => {
  const { translate } = useInternationalization()
  const isEdition = !!customer.billingConfiguration?.documentLocale
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
            // TODO: API should not require those fields on customer update
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
            customerName: `<span class="line-break-anywhere">${customer.name}</span>`,
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
      <Content>
        <ComboBoxField
          disableClearable
          name="billingConfiguration.documentLocale"
          label={translate('text_63ea0f84f400488553caa687')}
          placeholder={translate('text_63ea0f84f400488553caa68f')}
          helperText={
            <Typography variant="caption" html={translate('text_63e51ef4985f0ebd75c21312')} />
          }
          formikProps={formikProps}
          data={documentLocalesData}
          PopperProps={{ displayInDialog: true }}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditCustomerDocumentLocaleDialog.displayName = 'forwardRef'
