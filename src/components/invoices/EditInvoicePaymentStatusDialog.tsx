import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  InvoiceForUpdateInvoicePaymentStatusFragment,
  InvoiceListItemFragmentDoc,
  InvoicePaymentStatusTypeEnum,
  UpdateInvoiceInput,
  useUpdateInvoicePaymentStatusMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment InvoiceForUpdateInvoicePaymentStatus on Invoice {
    id
    paymentStatus
  }

  mutation updateInvoicePaymentStatus($input: UpdateInvoiceInput!) {
    updateInvoice(input: $input) {
      id
      ...InvoiceForUpdateInvoicePaymentStatus
      ...InvoiceListItem
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
  ${InvoiceListItemFragmentDoc}
`

export interface UpdateInvoicePaymentStatusDialogRef {
  openDialog: (invoice: InvoiceForUpdateInvoicePaymentStatusFragment) => unknown
  closeDialog: () => unknown
}

export const UpdateInvoicePaymentStatusDialog = forwardRef<UpdateInvoicePaymentStatusDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [invoice, setInvoice] = useState<InvoiceForUpdateInvoicePaymentStatusFragment>()
    const [updateInvoice] = useUpdateInvoicePaymentStatusMutation({
      onCompleted({ updateInvoice: updateInvoiceRes }) {
        if (updateInvoiceRes?.id) {
          addToast({
            message: translate('text_63eba8c65a6c8043feee2a02'),
            severity: 'success',
          })
        }
      },
    })
    const formikProps = useFormik<Omit<UpdateInvoiceInput, 'id'>>({
      initialValues: {
        paymentStatus: invoice?.paymentStatus || undefined,
      },
      validationSchema: object().shape({
        paymentStatus: string().required(''),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values, formikBag) => {
        if (!invoice?.id) return

        const res = await updateInvoice({
          variables: {
            input: {
              id: invoice.id,
              ...values,
            },
          },
        })

        if (res.data?.updateInvoice) {
          dialogRef?.current?.closeDialog()
          formikBag.resetForm()
        }
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setInvoice(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate('text_63eba8c65a6c8043feee2a0d')}
        description={translate('text_63eba8c65a6c8043feee2a0e')}
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
              {translate('text_63eba8c65a6c8043feee2a15')}
            </Button>
          </>
        )}
      >
        <ComboBoxField
          className="mb-8"
          name="paymentStatus"
          label={translate('text_63eba8c65a6c8043feee2a0f')}
          data={Object.values(InvoicePaymentStatusTypeEnum).map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
          }))}
          isEmptyNull={false}
          disableClearable
          formikProps={formikProps}
          PopperProps={{ displayInDialog: true }}
        />
      </Dialog>
    )
  },
)

UpdateInvoicePaymentStatusDialog.displayName = 'forwardRef'
