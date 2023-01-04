import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { formatDateToTZ } from '~/core/timezone'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  InvoiceForFinalizeInvoiceFragment,
  useFinalizeInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment InvoiceForFinalizeInvoice on Invoice {
    id
    issuingDate
    customer {
      id
      applicableTimezone
    }
  }

  mutation finalizeInvoice($input: FinalizeInvoiceInput!) {
    finalizeInvoice(input: $input) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
`

export interface FinalizeInvoiceDialogRef {
  openDialog: (invoice: InvoiceForFinalizeInvoiceFragment) => unknown
  closeDialog: () => unknown
}

export const FinalizeInvoiceDialog = forwardRef<FinalizeInvoiceDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [invoice, setInvoice] = useState<InvoiceForFinalizeInvoiceFragment>()
  const [finalizeInvoice] = useFinalizeInvoiceMutation({
    variables: { input: { id: invoice?.id || '' } },
    refetchQueries: ['getCustomerInvoices'],
    onCompleted({ finalizeInvoice: finalizeInvoiceRes }) {
      if (finalizeInvoiceRes?.id) {
        addToast({
          message: translate('text_63a41b3a01db40c7fff551e1'),
          severity: 'success',
        })
      }
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (infos) => {
      setInvoice(infos)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_63a4269f72ead1bda4bed106')}
      description={translate('text_63a4269f72ead1bda4bed108', {
        issuingDate: formatDateToTZ(
          invoice?.issuingDate,
          invoice?.customer?.applicableTimezone,
          "LLL. dd, yyyy U'T'CZ"
        ),
      })}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
            }}
          >
            {translate('text_63a4269f72ead1bda4bed10a')}
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await finalizeInvoice()
              closeDialog()
            }}
          >
            {translate('text_63a4269f72ead1bda4bed10c')}
          </Button>
        </>
      )}
    />
  )
})

FinalizeInvoiceDialog.displayName = 'forwardRef'
