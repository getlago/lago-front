import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { InvoiceCustomSection } from '~/generated/graphql'

/**
 * Maps InvoiceCustomSection items to MappedInvoiceSection format (id and name only).
 * Extracts only the id and name properties from each item, discarding other not needed fields.
 */
export const mapItemsToCustomerInvoiceSection = (
  item: InvoiceCustomSection,
): MappedInvoiceSection => {
  return {
    id: item.id,
    name: item.name,
  }
}
