import { forwardRef } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { object, string } from 'yup'
import { useFormik } from 'formik'

import { Dialog, Button, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  EditCustomerDocumentLocaleFragment,
  UpdateCustomerInput,
  useUpdateCustomerDocumentLocaleMutation,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { DocumentLocales } from '~/core/translations/documentLocales'
import { addToast } from '~/core/apolloClient'

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
  }
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
        isEdition ? 'text_63ea0f84f400488553caa65c' : 'text_63ea0f84f400488553caa678'
      )}
      description={translate('text_63ea0f84f400488553caa680', { customerName: customer.name })}
      onClickAway={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_63ea0f84f400488553caa6a5')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
              formikProps.resetForm()
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
