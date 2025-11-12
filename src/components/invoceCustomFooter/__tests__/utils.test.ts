import {
  addItemsWithoutDuplicates,
  getIntersectionOfSections,
  mapItemsToCustomerInvoiceSections,
} from '../utils'

describe('mapItemsToCustomerInvoiceSections', () => {
  it('should map InvoiceCustomSection items to MappedInvoiceSection format and discard other fields', () => {
    const items = [
      {
        __typename: 'InvoiceCustomSection' as const,
        id: 'section-1',
        name: 'Section 1',
        code: 'SECTION_1',
      },
      {
        __typename: 'InvoiceCustomSection' as const,
        id: 'section-2',
        name: 'Section 2',
        code: 'SECTION_2',
      },
    ]

    const result = mapItemsToCustomerInvoiceSections(items)

    expect(result).toEqual([
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ])
    expect(result[0]).not.toHaveProperty('code')
    expect(result[1]).not.toHaveProperty('code')
  })

  it('should return empty array when input is empty', () => {
    const result = mapItemsToCustomerInvoiceSections([])

    expect(result).toEqual([])
  })
})

describe('getIntersectionOfSections', () => {
  it('should return common sections based on id', () => {
    const sections1 = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
      { id: 'section-3', name: 'Section 3' },
    ]
    const sections2 = [
      { id: 'section-2', name: 'Section 2' },
      { id: 'section-3', name: 'Section 3' },
      { id: 'section-4', name: 'Section 4' },
    ]

    const result = getIntersectionOfSections(sections1, sections2)

    expect(result).toEqual([
      { id: 'section-2', name: 'Section 2' },
      { id: 'section-3', name: 'Section 3' },
    ])
  })

  it('should return empty array when there are no common elements', () => {
    const sections1 = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]
    const sections2 = [
      { id: 'section-3', name: 'Section 3' },
      { id: 'section-4', name: 'Section 4' },
    ]

    const result = getIntersectionOfSections(sections1, sections2)

    expect(result).toEqual([])
  })

  it('should return empty array when one of the arrays is empty', () => {
    const sections1 = [{ id: 'section-1', name: 'Section 1' }]
    const sections2: Array<{ id: string; name: string }> = []

    const result = getIntersectionOfSections(sections1, sections2)

    expect(result).toEqual([])
  })

  it('should return all sections when arrays are identical', () => {
    const sections = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    const result = getIntersectionOfSections(sections, sections)

    expect(result).toEqual(sections)
  })
})

describe('addItemsWithoutDuplicates', () => {
  it('should add new items that are not already present', () => {
    const newItems = [
      { id: 'section-3', name: 'Section 3' },
      { id: 'section-4', name: 'Section 4' },
    ]
    const existingSections = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    const result = addItemsWithoutDuplicates(newItems, existingSections)

    expect(result).toEqual([
      { id: 'section-3', name: 'Section 3' },
      { id: 'section-4', name: 'Section 4' },
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ])
  })

  it('should not add items that already exist in existingSections', () => {
    const newItems = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-3', name: 'Section 3' },
    ]
    const existingSections = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    const result = addItemsWithoutDuplicates(newItems, existingSections)

    expect(result).toEqual([
      { id: 'section-3', name: 'Section 3' },
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ])
    expect(result).toHaveLength(3)
  })

  it('should return existingSections when newItems is empty', () => {
    const newItems: Array<{ id: string; name: string }> = []
    const existingSections = [{ id: 'section-1', name: 'Section 1' }]

    const result = addItemsWithoutDuplicates(newItems, existingSections)

    expect(result).toEqual(existingSections)
  })

  it('should return newItems when existingSections is empty', () => {
    const newItems = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]
    const existingSections: Array<{ id: string; name: string }> = []

    const result = addItemsWithoutDuplicates(newItems, existingSections)

    expect(result).toEqual(newItems)
  })

  it('should filter out all duplicates when all newItems already exist', () => {
    const newItems = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]
    const existingSections = [
      { id: 'section-1', name: 'Section 1' },
      { id: 'section-2', name: 'Section 2' },
    ]

    const result = addItemsWithoutDuplicates(newItems, existingSections)

    expect(result).toEqual(existingSections)
    expect(result).toHaveLength(2)
  })
})
