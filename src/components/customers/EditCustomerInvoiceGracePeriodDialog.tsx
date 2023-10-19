import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { number, object } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  UpdateCustomerInput,
  useUpdateCustomerInvoiceGracePeriodMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment EditCustomerInvoiceGracePeriod on Customer {
    id
    invoiceGracePeriod
  }

  mutation updateCustomerInvoiceGracePeriod($input: UpdateCustomerInvoiceGracePeriodInput!) {
    updateCustomerInvoiceGracePeriod(input: $input) {
      id
      ...EditCustomerInvoiceGracePeriod
    }
  }
`

export interface EditCustomerInvoiceGracePeriodDialogRef extends DialogRef {}

interface EditCustomerInvoiceGracePeriodDialogProps {
  invoiceGracePeriod: number | undefined | null
}

export const EditCustomerInvoiceGracePeriodDialog = forwardRef<
  DialogRef,
  EditCustomerInvoiceGracePeriodDialogProps
>(({ invoiceGracePeriod }: EditCustomerInvoiceGracePeriodDialogProps, ref) => {
  const { customerId } = useParams()
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
      invoiceGracePeriod: number().required('').max(365, 'text_63bed78ae69de9cad5c348e4'),
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
