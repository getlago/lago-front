import { renderHook } from '@testing-library/react'

import {
  createInvoiceCustomSection,
  mockCustomerSections,
  mockOrgSections,
} from './factories/invoiceCustomSectionFactory'

import { useInvoiceCustomSectionsIntersection } from '../useInvoiceCustomSectionsIntersection'

describe('useInvoiceCustomSectionsIntersection', () => {
  describe('WHEN sections have common elements', () => {
    it('THEN returns intersection with common sections', () => {
      const { result } = renderHook(() =>
        useInvoiceCustomSectionsIntersection({
          orgInvoiceSections: mockOrgSections,
          customerInvoiceSections: mockCustomerSections,
        }),
      )

      expect(result.current.intersection).toHaveLength(2)
      expect(result.current.intersection).toEqual([
        { id: 'section-2', name: 'Section 2' },
        { id: 'section-3', name: 'Section 3' },
      ])
      expect(result.current.intersectionKey).toBe('section-2,section-3')
    })
  })

  describe('WHEN sections have no common elements', () => {
    it('THEN returns empty intersection', () => {
      const { result } = renderHook(() =>
        useInvoiceCustomSectionsIntersection({
          orgInvoiceSections: mockOrgSections,
          customerInvoiceSections: [
            createInvoiceCustomSection({ id: 'section-5', name: 'Section 5', code: 'SECTION_5' }),
          ],
        }),
      )

      expect(result.current.intersection).toHaveLength(0)
      expect(result.current.intersectionKey).toBe('')
    })
  })

  describe('WHEN customerInvoiceSections is undefined', () => {
    it('THEN returns empty intersection', () => {
      const { result } = renderHook(() =>
        useInvoiceCustomSectionsIntersection({
          orgInvoiceSections: mockOrgSections,
          customerInvoiceSections: undefined,
        }),
      )

      expect(result.current.intersection).toHaveLength(0)
      expect(result.current.intersectionKey).toBe('')
    })
  })

  describe('WHEN customerInvoiceSections is empty array', () => {
    it('THEN returns empty intersection', () => {
      const { result } = renderHook(() =>
        useInvoiceCustomSectionsIntersection({
          orgInvoiceSections: mockOrgSections,
          customerInvoiceSections: [],
        }),
      )

      expect(result.current.intersection).toHaveLength(0)
      expect(result.current.intersectionKey).toBe('')
    })
  })

  describe('WHEN orgInvoiceSections is empty array', () => {
    it('THEN returns empty intersection', () => {
      const { result } = renderHook(() =>
        useInvoiceCustomSectionsIntersection({
          orgInvoiceSections: [],
          customerInvoiceSections: mockCustomerSections,
        }),
      )

      expect(result.current.intersection).toHaveLength(0)
      expect(result.current.intersectionKey).toBe('')
    })
  })
})
