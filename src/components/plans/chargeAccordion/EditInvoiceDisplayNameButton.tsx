import { Button, Tooltip } from 'lago-design-system'
import { RefObject } from 'react'

import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const EditInvoiceDisplayNameButton = ({
  editInvoiceDisplayNameDialogRef,
  currentInvoiceDisplayName,
  onEdit,
}: {
  editInvoiceDisplayNameDialogRef: RefObject<EditInvoiceDisplayNameDialogRef>
  currentInvoiceDisplayName: string | null | undefined
  onEdit: (invoiceDisplayName: string) => void
}) => {
  const { translate } = useInternationalization()

  return (
    <Tooltip title={translate('text_65018c8e5c6b626f030bcf8d')} placement="top-end">
      <Button
        icon="pen"
        variant="quaternary"
        size="small"
        onClick={(e) => {
          e.stopPropagation()

          editInvoiceDisplayNameDialogRef.current?.openDialog({
            invoiceDisplayName: currentInvoiceDisplayName,
            callback: onEdit,
          })
        }}
      />
    </Tooltip>
  )
}
