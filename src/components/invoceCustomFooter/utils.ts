import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { InvoiceCustomSection } from '~/generated/graphql'

/**
 * Maps InvoiceCustomSection items to MappedInvoiceSection format (id and name only).
 * Extracts only the id and name properties from each item, discarding other not needed fields.
 */
export const mapItemsToCustomerInvoiceSections = (
  items: InvoiceCustomSection[],
): MappedInvoiceSection[] => {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
  }))
}

/**
 * Returns the intersection of two InvoiceSection arrays based on their id.
 * Returns an empty array if there are no common elements.
 */
export const getIntersectionOfSections = (
  sections1: MappedInvoiceSection[],
  sections2: MappedInvoiceSection[],
): MappedInvoiceSection[] => {
  const sectionIds2 = new Set(sections2.map((section) => section.id))

  return sections1.filter((section) => sectionIds2.has(section.id))
}

/**
 * Adds new items to existing sections, avoiding duplicates based on id.
 * Only items that are not already present in existingSections will be added.
 */
export const addItemsWithoutDuplicates = (
  newItems: MappedInvoiceSection[],
  existingSections: MappedInvoiceSection[],
): MappedInvoiceSection[] => {
  const selectedIds = new Set(existingSections.map((section) => section.id))
  const uniqueNewItems = newItems.filter((item) => !selectedIds.has(item.id))

  return [...uniqueNewItems, ...existingSections]
}
