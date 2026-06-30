import { InvoiceCustomSection } from '~/generated/graphql'

export type InvoiceCustomSectionBasic = Pick<InvoiceCustomSection, 'id' | 'name'>

// The three ways a billing object can resolve its invoice custom sections.
// Lives here (not in a component) so both the inline fields and the dialog
// shell can import it without a circular dependency.
export enum InvoiceCustomSectionBehavior {
  FALLBACK = 'fallback',
  APPLY = 'apply',
  NONE = 'none',
}

/**
 * Represents the input structure for invoice custom sections.
 * This type is reusable across different contexts (subscriptions, one-off invoices, etc.)
 */
export interface InvoiceCustomSectionInput {
  invoiceCustomSections: InvoiceCustomSectionBasic[]
  skipInvoiceCustomSections: boolean
}
