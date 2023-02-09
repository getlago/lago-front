import { forwardRef } from 'react'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateOrganizationInvoiceTemplateMutation } from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast } from '~/core/apolloClient'

const MAX_CHAR_LIMIT = 600

gql`
  fragment EditOrganizationInvoiceTemplateDialog on Organization {
    billingConfiguration {
      id
      invoiceFooter
    }
  }

  mutation updateOrganizationInvoiceTemplate($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationInvoiceTemplateDialog
    }
  }
`

export interface EditOrganizationInvoiceTemplateDialogRef extends DialogRef {}

interface EditOrganizationInvoiceTemplateDialogProps {
  invoiceFooter: string
}

export const EditOrganizationInvoiceTemplateDialog = forwardRef<
  DialogRef,
  EditOrganizationInvoiceTemplateDialogProps
>(({ invoiceFooter }: EditOrganizationInvoiceTemplateDialogProps, ref) => {
  const { translate } = useInternationalization()
  const [updateOrganizationInvoiceTemplate] = useUpdateOrganizationInvoiceTemplateMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: 'text_62bb10ad2a10bd182d002077',
        })
      }
    },
  })

  // Type is manually written here as errors type are not correclty read from UpdateOrganizationInput
  const formikProps = useFormik<{ billingConfiguration: { invoiceFooter: string } }>({
    initialValues: {
      billingConfiguration: { invoiceFooter },
    },
    validationSchema: object().shape({
      billingConfiguration: object().shape({
        invoiceFooter: string().max(600, 'text_62bb10ad2a10bd182d00203b'),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await updateOrganizationInvoiceTemplate({
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
      title={translate('text_62bb10ad2a10bd182d00201d')}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_62bb10ad2a10bd182d002031')}
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
            {translate('text_62bb10ad2a10bd182d002037')}
          </Button>
        </>
      )}
    >
      <Content>
        <TextArea
          name="billingConfiguration.invoiceFooter"
          rows="4"
          multiline
          label={translate('text_62bb10ad2a10bd182d002023')}
          placeholder={translate('text_62bb10ad2a10bd182d00202b')}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          formikProps={formikProps}
          error={formikProps.errors?.billingConfiguration?.invoiceFooter}
          helperText={
            <TextInputHelper>
              <div>
                {!!formikProps.errors?.billingConfiguration?.invoiceFooter
                  ? translate('text_62bb10ad2a10bd182d00203b')
                  : translate('text_62bc52dd8536260acc9eb762')}
              </div>
              <div>
                {formikProps.values.billingConfiguration?.invoiceFooter?.length}/{MAX_CHAR_LIMIT}
              </div>
            </TextInputHelper>
          }
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const TextArea = styled(TextInputField)`
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

EditOrganizationInvoiceTemplateDialog.displayName = 'forwardRef'
