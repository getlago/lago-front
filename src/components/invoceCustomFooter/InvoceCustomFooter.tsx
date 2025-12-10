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
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'

export const EDIT_BUTTON = 'invoice-custom-footer-edit-button'
export const SECTION_CHIP = (sectionId: string) => `invoice-custom-footer-section-${sectionId}`
export const FALLBACK_BILLING_ENTITY_LABEL = 'invoice-custom-footer-fallback-billing-entity-label'

type DisplayState =
  | { type: 'apply'; sections: MappedInvoiceSection[] }
  | { type: 'none' }
  | { type: 'fallback_customer_sections'; sections: MappedInvoiceSection[] }
  | { type: 'fallback_customer_skip' }
  | { type: 'fallback_billing_entity'; sections: MappedInvoiceSection[] }
  | { type: 'fallback_empty' }

interface InvoceCustomFooterProps {
  customerId: string
  title: string
  description: string
  viewType: string
  invoiceCustomSection?: InvoiceCustomSectionsReferenceInput
  setInvoiceCustomSection?: (item: InvoiceCustomSectionsReferenceInput) => void
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

  // Org-level sections (billing entity fallback)
  const { data: orgInvoiceCustomSections } = useInvoiceCustomSections()

  // Customer-level settings for invoice custom sections
  const { data: customerData } = useCustomerInvoiceCustomSections(customerId)

  // Determine current behavior based on form values
  const currentBehavior = useMemo((): InvoiceCustomSectionBehavior => {
    const formIds = invoiceCustomSection?.invoiceCustomSectionIds
    const formSkip = invoiceCustomSection?.skipInvoiceCustomSections

    // If subscription explicitly skips ICSs → NONE (takes precedence)
    if (formSkip === true) {
      return InvoiceCustomSectionBehavior.NONE
    }

    // If subscription has explicit sections selected against → APPLY
    if (formIds?.length) {
      return InvoiceCustomSectionBehavior.APPLY
    }

    // Otherwise → FALLBACK (inherit from customer/billing entity)
    return InvoiceCustomSectionBehavior.FALLBACK
  }, [
    invoiceCustomSection?.invoiceCustomSectionIds,
    invoiceCustomSection?.skipInvoiceCustomSections,
  ])

  const displayState = useMemo((): DisplayState => {
    // APPLY - use form ICSs values
    if (currentBehavior === InvoiceCustomSectionBehavior.APPLY) {
      const formIds = invoiceCustomSection?.invoiceCustomSectionIds ?? []
      const sections = formIds
        .map((id) => {
          const section = orgInvoiceCustomSections?.find((s) => s.id === id)

          return section ? { id: section.id, name: section.name } : null
        })
        .filter((s): s is MappedInvoiceSection => s !== null)

      return { type: 'apply', sections }
    }

    // NONE - do not display any ICSs
    if (currentBehavior === InvoiceCustomSectionBehavior.NONE) {
      return { type: 'none' }
    }

    // FALLBACK - ignore form values, use customer ICSs
    if (customerData) {
      const sections = customerData.configurableInvoiceCustomSections

      // Do not display any ICSs (inherit from customer)
      if (
        !customerData.hasOverwrittenInvoiceCustomSectionsSelection &&
        customerData.skipInvoiceCustomSections
      ) {
        return { type: 'fallback_customer_skip' }
      }

      // Inherit from customer
      if (
        customerData.hasOverwrittenInvoiceCustomSectionsSelection &&
        !customerData.skipInvoiceCustomSections
      ) {
        if (sections.length > 0) {
          return { type: 'fallback_customer_sections', sections }
        }
      }

      // Inherit from billing entity
      if (
        !customerData.hasOverwrittenInvoiceCustomSectionsSelection &&
        !customerData.skipInvoiceCustomSections
      ) {
        if (sections.length > 0) {
          return { type: 'fallback_billing_entity', sections }
        }
      }
    }

    // No sections anywhere
    return { type: 'fallback_empty' }
  }, [
    currentBehavior,
    invoiceCustomSection?.invoiceCustomSectionIds,
    customerData,
    orgInvoiceCustomSections,
  ])

  // This is the Org-level ICSs to pass to the dialog (only for APPLY behavior for the MultipleComboBox)
  const dialogSelectedSections = useMemo((): MappedInvoiceSection[] => {
    if (displayState.type === 'apply') {
      return displayState.sections
    }
    return []
  }, [displayState])

  const getViewTypeLabel = (): string => {
    if (viewType === 'subscription') {
      return translate('text_1764327933607nrezuuiheuc')
    }
    return viewType
  }

  const handleDialogSave = (selection: InvoiceCustomSectionSelection) => {
    const { behavior, selectedSections: newSelectedSections } = selection

    if (behavior === InvoiceCustomSectionBehavior.FALLBACK) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: [],
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.APPLY) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: newSelectedSections.map((s) => s.id),
        skipInvoiceCustomSections: false,
      })
    } else if (behavior === InvoiceCustomSectionBehavior.NONE) {
      setInvoiceCustomSection?.({
        invoiceCustomSectionIds: [],
        skipInvoiceCustomSections: true,
      })
    }
  }

  const renderDisplayContent = () => {
    switch (displayState.type) {
      case 'apply':
        return (
          <div className="flex flex-wrap gap-2">
            {displayState.sections.map((section) => (
              <Chip key={section.id} label={section.name} data-test={SECTION_CHIP(section.id)} />
            ))}
          </div>
        )

      case 'none':
        return (
          <Typography variant="body" color="grey700">
            {translate('text_176537313551954twfx3pys9', { object: getViewTypeLabel() })}
          </Typography>
        )

      case 'fallback_customer_sections':
        return (
          <>
            <Typography variant="body" color="grey700">
              {translate('text_1765373135518xm96ypchuls')}
            </Typography>
            <div className="flex flex-wrap gap-2">
              {displayState.sections.map((section) => (
                <Chip key={section.id} label={section.name} data-test={SECTION_CHIP(section.id)} />
              ))}
            </div>
          </>
        )

      case 'fallback_customer_skip':
        return (
          <Typography variant="body" color="grey700">
            {translate('text_17653731355193nuiojugqom', { object: getViewTypeLabel() })}
          </Typography>
        )

      case 'fallback_billing_entity':
        return (
          <>
            <Typography variant="body" color="grey700" data-test={FALLBACK_BILLING_ENTITY_LABEL}>
              {translate('text_1765373135519xqsbx2q5h1h')}
            </Typography>
            <div className="flex flex-wrap gap-2">
              {displayState.sections.map((section) => (
                <Chip key={section.id} label={section.name} data-test={SECTION_CHIP(section.id)} />
              ))}
            </div>
          </>
        )

      case 'fallback_empty':
        return null
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
      <div className="flex flex-col gap-3">
        {renderDisplayContent()}

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
        selectedSections={dialogSelectedSections}
        skipInvoiceCustomSections={currentBehavior === InvoiceCustomSectionBehavior.NONE}
        onSave={handleDialogSave}
        viewType={viewType}
      />
    </div>
  )
}
