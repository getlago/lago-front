import { useMemo, useState } from 'react'

import { Button, Chip, Typography } from '~/components/designSystem'
import {
  EditInvoiceCustomSectionDialog,
  InvoiceCustomSectionBehavior,
  InvoiceCustomSectionSelection,
} from '~/components/invoceCustomFooter/EditInvoiceCustomSectionDialog'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { InvoiceCustomSectionsReferenceInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'

export const EDIT_BUTTON = 'invoice-custom-footer-edit-button'
export const SECTION_CHIP = (sectionId: string) => `invoice-custom-footer-section-${sectionId}`

interface InvoceCustomFooterProps {
  title: string
  description: string
  viewType: string
  invoiceCustomSection?: InvoiceCustomSectionsReferenceInput
  setInvoiceCustomSection?: (item: InvoiceCustomSectionsReferenceInput) => void
}

export const InvoceCustomFooter = ({
  title,
  description,
  viewType,
  invoiceCustomSection,
  setInvoiceCustomSection,
}: InvoceCustomFooterProps) => {
  const { translate } = useInternationalization()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: orgInvoiceCustomSections } = useInvoiceCustomSections()

  const skipInvoiceCustomSections = invoiceCustomSection?.skipInvoiceCustomSections ?? false

  // Derive selected sections from form state + org sections list
  const selectedSections = useMemo((): MappedInvoiceSection[] => {
    if (skipInvoiceCustomSections) return []

    const ids = invoiceCustomSection?.invoiceCustomSectionIds

    if (!ids?.length || !orgInvoiceCustomSections?.length) return []

    return ids
      .map((id) => {
        const section = orgInvoiceCustomSections.find((s) => s.id === id)

        return section ? { id: section.id, name: section.name } : null
      })
      .filter((s): s is MappedInvoiceSection => s !== null)
  }, [
    skipInvoiceCustomSections,
    invoiceCustomSection?.invoiceCustomSectionIds,
    orgInvoiceCustomSections,
  ])

  const handleDialogSave = (selection: InvoiceCustomSectionSelection) => {
    const { behavior, selectedSections: newSelectedSections } = selection

    if (behavior === InvoiceCustomSectionBehavior.FALLBACK) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: null,
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.APPLY) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: newSelectedSections.map((s) => s.id),
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.NONE) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: null,
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
        <Typography variant="caption" className="mb-3">
          {description}
        </Typography>
      )}
      <div className="flex flex-col gap-4">
        {selectedSections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSections.map((section) => (
              <Chip key={section.id} label={section.name} data-test={SECTION_CHIP(section.id)} />
            ))}
          </div>
        )}

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
        skipInvoiceCustomSections={skipInvoiceCustomSections}
        onSave={handleDialogSave}
        viewType={viewType}
      />
    </div>
  )
}
