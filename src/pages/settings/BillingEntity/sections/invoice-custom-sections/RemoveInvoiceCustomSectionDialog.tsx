import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Typography } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  BillingEntity,
  useRemoveBillingEntityInvoiceCustomSectionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation removeBillingEntityInvoiceCustomSection($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
    }
  }
`

export type RemoveInvoiceCustomSectionDialogRef = {
  openDialog: (billingEntity: BillingEntity, invoiceCustomSectionId: string) => unknown
  closeDialog: () => unknown
}

export const RemoveInvoiceCustomSectionDialog = forwardRef<RemoveInvoiceCustomSectionDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)

    const [invoiceCustomSectionId, setInvoiceCustomSectionId] = useState<string | null>(null)
    const [billingEntity, setBillingEntity] = useState<BillingEntity | null>(null)

    const [removeInvoiceCustomSection] = useRemoveBillingEntityInvoiceCustomSectionMutation({
      onCompleted(data) {
        if (data) {
          addToast({
            message: translate('text_1749026767605fq828vbnnwr'),
            severity: 'success',
          })
        }
      },
      refetchQueries: ['getBillingEntity'],
    })

    useImperativeHandle(ref, () => ({
      openDialog: (_billingEntity, _invoiceCustomSectionId) => {
        setBillingEntity(_billingEntity)
        setInvoiceCustomSectionId(_invoiceCustomSectionId)

        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_1749026767605ghziw4tp647')}
        description={<Typography>{translate('text_17490267676056wp5w8xz9h5')}</Typography>}
        onContinue={async () => {
          if (billingEntity && invoiceCustomSectionId) {
            await removeInvoiceCustomSection({
              variables: {
                input: {
                  id: billingEntity.id,
                  invoiceCustomSectionIds: [
                    ...(billingEntity?.selectedInvoiceCustomSections
                      ?.filter((s) => s.id !== invoiceCustomSectionId)
                      .map((s) => s.id) || []),
                  ],
                },
              },
            })
          }
        }}
        continueText={translate('text_1749035464124mstmqfrzuvl')}
      />
    )
  },
)

RemoveInvoiceCustomSectionDialog.displayName = 'RemoveInvoiceCustomSectionDialog'
