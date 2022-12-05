import { forwardRef } from 'react'
import { useFormik } from 'formik'
import { number, object } from 'yup'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import { InputAdornment } from '@mui/material'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  UpdateCustomerInput,
  useUpdateCustomerInvoiceGracePeriodMutation,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast } from '~/core/apolloClient'

gql`
  mutation updateCustomerInvoiceGracePeriod($input: UpdateCustomerInvoiceGracePeriodInput!) {
    updateCustomerInvoiceGracePeriod(input: $input) {
      id
      invoiceGracePeriod
    }
  }
`

export interface EditCustomerInvoiceGracePeriodDialogRef extends DialogRef {}

interface EditCustomerInvoiceGracePeriodDialogProps {
  invoiceGracePeriod: number
}

export const EditCustomerInvoiceGracePeriodDialog = forwardRef<
  DialogRef,
  EditCustomerInvoiceGracePeriodDialogProps
>(({ invoiceGracePeriod }: EditCustomerInvoiceGracePeriodDialogProps, ref) => {
  const { id: customerId } = useParams()
  const { translate } = useInternationalization()
  const [updateCustomerInvoiceGracePeriod] = useUpdateCustomerInvoiceGracePeriodMutation({
    onCompleted(res) {
      if (res?.updateCustomerInvoiceGracePeriod) {
        addToast({
          severity: 'success',
          translateKey: 'text_638dff9779fb99299bee914a',
        })
      }
    },
  })
  const formikProps = useFormik<Pick<UpdateCustomerInput, 'invoiceGracePeriod'>>({
    initialValues: {
      invoiceGracePeriod,
    },
    validationSchema: object().shape({
      invoiceGracePeriod: number().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await updateCustomerInvoiceGracePeriod({
        variables: {
          input: {
            id: customerId || '',
            ...values,
          },
        },
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_638dff9779fb99299bee90b0')}
      description={translate('text_638dff9779fb99299bee90b4')}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_638dff9779fb99299bee90c8')}
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
            {translate('text_638dff9779fb99299bee90cc')}
          </Button>
        </>
      )}
    >
      <Content>
        <TextInputField
          name="invoiceGracePeriod"
          beforeChangeFormatter={['positiveNumber', 'int']}
          label={translate('text_638dff9779fb99299bee90bc')}
          placeholder={translate('text_638dff9779fb99299bee90c0')}
          formikProps={formikProps}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {translate('text_638dff9779fb99299bee90c4')}
              </InputAdornment>
            ),
          }}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditCustomerInvoiceGracePeriodDialog.displayName = 'forwardRef'
