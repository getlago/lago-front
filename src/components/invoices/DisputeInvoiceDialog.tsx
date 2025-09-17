import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { DialogRef } from '~/components/designSystem'
import { WarningDialog } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc,
  useDisputeInvoiceMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation disputeInvoice($input: LoseInvoiceDisputeInput!) {
    loseInvoiceDispute(input: $input) {
      id
      status
      ...AllInvoiceDetailsForCustomerInvoiceDetails
    }
  }

  # Fragments needed to refresh data from other parts of the UI
  ${AllInvoiceDetailsForCustomerInvoiceDetailsFragmentDoc}
`

type DisputeInvoiceDialogProps = {
  id: string
}

export interface DisputeInvoiceDialogRef {
  openDialog: (dialogData: DisputeInvoiceDialogProps) => unknown
  closeDialog: () => unknown
}

export const DisputeInvoiceDialog = forwardRef<DisputeInvoiceDialogRef>((_, ref) => {
  const dialogRef = useRef<DialogRef>(null)
  const { translate } = useInternationalization()
  const [dialogData, setDialogData] = useState<DisputeInvoiceDialogProps | undefined>(undefined)

  const [disputeInvoice] = useDisputeInvoiceMutation({
    onCompleted(data) {
      if (data && data.loseInvoiceDispute) {
        addToast({
          message: translate('text_66141e9feef09978ae251222'),
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getInvoiceSubscriptions'],
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setDialogData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <WarningDialog
      ref={dialogRef}
      title={translate('text_66141e30699a0631f0b2ec59')}
      description={translate('text_66141e30699a0631f0b2ec61')}
      onContinue={async () =>
        await disputeInvoice({
          variables: { input: { id: dialogData?.id as string } },
        })
      }
      continueText={translate('text_66141e30699a0631f0b2ec71')}
    />
  )
})

DisputeInvoiceDialog.displayName = 'DisputeInvoiceDialog'
