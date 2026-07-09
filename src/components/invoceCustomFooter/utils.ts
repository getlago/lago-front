import { InvoiceCustomSectionsReferenceInput } from '~/generated/graphql'
import { CustomerInvoiceCustomSectionsData } from '~/hooks/useCustomerInvoiceCustomSections'

import { InvoiceCustomSectionBasic, InvoiceCustomSectionInput } from './types'

/**
 * Converts InvoiceCustomSectionInput (with names) to InvoiceCustomSectionsReferenceInput (IDs only) for GraphQL
 */
export const toInvoiceCustomSectionReference = (
  input?: InvoiceCustomSectionInput | null,
): InvoiceCustomSectionsReferenceInput | undefined => {
  if (!input) return undefined

  return {
    invoiceCustomSectionIds: input.invoiceCustomSections?.map((s) => s.id) || [],
    skipInvoiceCustomSections: input.skipInvoiceCustomSections,
  }
}

export type InvoiceCustomSectionsDisplayState =
  | { type: 'apply'; sections: InvoiceCustomSectionBasic[] }
  | { type: 'none' }
  | { type: 'fallback_customer_sections'; sections: InvoiceCustomSectionBasic[] }
  | { type: 'fallback_customer_skip' }
  | { type: 'fallback_billing_entity'; sections: InvoiceCustomSectionBasic[] }
  | { type: 'fallback_empty' }

/**
 * Derives what the invoice custom sections display should show for an entity:
 * its explicit selection or skip take precedence, otherwise it falls back to
 * the customer-level data (customer overwrite, customer skip, or the sections
 * inherited from the billing entity). Single source of truth shared by
 * InvoiceCustomSectionDisplay (rendering) and hasInvoiceCustomSectionsContent
 * (row-visibility gating), so the two can never drift apart.
 */
export const computeInvoiceCustomSectionsDisplayState = ({
  selectedSections,
  skipSections,
  customerIcsData,
}: {
  selectedSections?: InvoiceCustomSectionBasic[] | null
  skipSections?: boolean | null
  customerIcsData: CustomerInvoiceCustomSectionsData | null
}): InvoiceCustomSectionsDisplayState => {
  // NONE - explicitly skip all ICS (takes precedence)
  if (skipSections === true) {
    return { type: 'none' }
  }

  // APPLY - use explicit section selection (not customer data)
  if (selectedSections?.length) {
    return { type: 'apply', sections: selectedSections }
  }

  // FALLBACK - inherit from customer/billing entity
  if (customerIcsData) {
    const sections = customerIcsData.configurableInvoiceCustomSections
    const hasOverwritten = customerIcsData.hasOverwrittenInvoiceCustomSectionsSelection
    const customerSkipSections = customerIcsData.skipInvoiceCustomSections

    // Customer explicitly skipped ICS
    if (!hasOverwritten && customerSkipSections) {
      return { type: 'fallback_customer_skip' }
    }

    // Customer has overwritten selection with specific sections
    if (hasOverwritten && !customerSkipSections && sections.length > 0) {
      return { type: 'fallback_customer_sections', sections }
    }

    // Fallback to billing entity
    if (!hasOverwritten && !customerSkipSections && sections.length > 0) {
      return { type: 'fallback_billing_entity', sections }
    }
  }

  // No sections anywhere
  return { type: 'fallback_empty' }
}

/**
 * Whether an entity's invoice custom sections have anything to display — an
 * explicit selection, an explicit skip, or an inherited customer/billing-entity
 * fallback. Derived from the same display-state machine used by
 * InvoiceCustomSectionDisplay, so callers can hide the row exactly when the
 * display would render nothing.
 */
export const hasInvoiceCustomSectionsContent = ({
  skipInvoiceCustomSections,
  selectedInvoiceCustomSections,
  customerIcsData,
}: {
  skipInvoiceCustomSections?: boolean | null
  selectedInvoiceCustomSections?: InvoiceCustomSectionBasic[] | null
  customerIcsData: CustomerInvoiceCustomSectionsData | null
}): boolean =>
  computeInvoiceCustomSectionsDisplayState({
    selectedSections: selectedInvoiceCustomSections,
    skipSections: skipInvoiceCustomSections,
    customerIcsData,
  }).type !== 'fallback_empty'
