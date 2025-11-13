import { mapItemsToCustomerInvoiceSection } from '~/components/invoceCustomFooter/utils'

import { createInvoiceCustomSection } from './factories/invoiceCustomSectionFactory'

describe('mapItemsToCustomerInvoiceSection', () => {
  it('should map InvoiceCustomSection items to MappedInvoiceSection format and discard other fields', () => {
    const items = createInvoiceCustomSection({
      id: 'section-1',
      name: 'Section 1',
      code: 'SECTION_1',
    })

    const result = mapItemsToCustomerInvoiceSection(items)

    expect(result).toEqual({ id: 'section-1', name: 'Section 1' })
    expect(result).not.toHaveProperty('code')
  })
})
