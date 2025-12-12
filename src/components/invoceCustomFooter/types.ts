import { InvoiceCustomSection } from '~/generated/graphql'

export type InvoiceCustomSectionBasic = Pick<InvoiceCustomSection, 'id' | 'name'>

/**
 * Represents the input structure for invoice custom sections.
 * This type is reusable across different contexts (subscriptions, one-off invoices, etc.)
 */
export interface InvoiceCustomSectionInput {
  invoiceCustomSections: InvoiceCustomSectionBasic[]
  skipInvoiceCustomSections: boolean
}
