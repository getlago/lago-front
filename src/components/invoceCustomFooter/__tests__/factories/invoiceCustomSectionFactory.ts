import { InvoiceCustomSection } from '~/generated/graphql'

interface CreateInvoiceCustomSectionParams {
  id?: string
  name?: string
  code?: string
}

export const createInvoiceCustomSection = ({
  id = 'section-1',
  name = 'Section 1',
  code = 'SECTION_1',
}: CreateInvoiceCustomSectionParams = {}): InvoiceCustomSection => {
  return {
    __typename: 'InvoiceCustomSection',
    id,
    name,
    code,
  }
}

export const createInvoiceCustomSections = (
  count: number,
  baseId: string = 'section',
): InvoiceCustomSection[] => {
  return Array.from({ length: count }, (_, index) => {
    const num = index + 1

    return createInvoiceCustomSection({
      id: `${baseId}-${num}`,
      name: `Section ${num}`,
      code: `SECTION_${num}`,
    })
  })
}

export const mockOrgSections: InvoiceCustomSection[] = [
  createInvoiceCustomSection({ id: 'section-1', name: 'Section 1', code: 'SECTION_1' }),
  createInvoiceCustomSection({ id: 'section-2', name: 'Section 2', code: 'SECTION_2' }),
  createInvoiceCustomSection({ id: 'section-3', name: 'Section 3', code: 'SECTION_3' }),
]

export const mockCustomerSections: InvoiceCustomSection[] = [
  createInvoiceCustomSection({ id: 'section-2', name: 'Section 2', code: 'SECTION_2' }),
  createInvoiceCustomSection({ id: 'section-3', name: 'Section 3', code: 'SECTION_3' }),
  createInvoiceCustomSection({ id: 'section-4', name: 'Section 4', code: 'SECTION_4' }),
]
