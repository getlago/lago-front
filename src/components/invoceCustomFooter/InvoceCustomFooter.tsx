import { useState } from 'react'

import { Button, Typography } from '~/components/designSystem'
import {
  EditInvoiceCustomSectionDialog,
  InvoiceCustomSectionBehavior,
  InvoiceCustomSectionSelection,
} from '~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceCustomSectionDisplay } from './InvoiceCustomSectionDisplay'
import { InvoiceCustomSectionInput } from './types'

import { ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export const EDIT_BUTTON = 'invoice-custom-footer-edit-button'

interface InvoceCustomFooterProps {
  customerId: string
  title: string
  description: string
  viewType: ViewTypeEnum
  invoiceCustomSection?: InvoiceCustomSectionInput
  setInvoiceCustomSection?: (item: InvoiceCustomSectionInput) => void
}

export const InvoceCustomFooter = ({
  customerId,
  title,
  description,
  viewType,
  invoiceCustomSection,
  setInvoiceCustomSection,
}: InvoceCustomFooterProps) => {
  const { translate } = useInternationalization()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const selectedSections = invoiceCustomSection?.invoiceCustomSections || []
  const skipSections = invoiceCustomSection?.skipInvoiceCustomSections || false

  const handleDialogSave = (selection: InvoiceCustomSectionSelection) => {
    const { behavior, selectedSections: newSelectedSections } = selection

    if (behavior === InvoiceCustomSectionBehavior.FALLBACK) {
      setInvoiceCustomSection?.({
        invoiceCustomSections: [],
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.APPLY) {
      setInvoiceCustomSection?.({
        invoiceCustomSections: newSelectedSections,
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.NONE) {
      setInvoiceCustomSection?.({
        invoiceCustomSections: [],
        skipInvoiceCustomSections: true,
      })
    }
  }

  return (
    <div>
      {title && (
        <Typography variant="captionHl" color="textSecondary">
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="caption" className="mb-4">
          {description}
        </Typography>
      )}
      <div className="flex flex-col gap-3">
        <InvoiceCustomSectionDisplay
          selectedSections={selectedSections}
          skipSections={skipSections}
          customerId={customerId}
          viewType={viewType}
        />

        <div className="flex items-start">
          <Button
            variant="inline"
            startIcon="pen"
            onClick={() => setIsDialogOpen(true)}
            data-test={EDIT_BUTTON}
          >
            {translate('text_1765363318310jm7wdrj7zzk')}
          </Button>
        </div>
      </div>

      <EditInvoiceCustomSectionDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedSections={selectedSections}
        skipInvoiceCustomSections={skipSections}
        onSave={handleDialogSave}
        viewType={viewType}
      />
    </div>
  )
}
