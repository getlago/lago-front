import { useMemo } from 'react'

import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import {
  getIntersectionOfSections,
  mapItemsToCustomerInvoiceSections,
} from '~/components/invoceCustomFooter/utils'
import { InvoiceCustomSection } from '~/generated/graphql'

interface UseInvoiceCustomSectionsIntersectionProps {
  orgInvoiceSections: InvoiceCustomSection[]
  customerInvoiceSections?: InvoiceCustomSection[]
}

interface UseInvoiceCustomSectionsIntersectionReturn {
  intersection: MappedInvoiceSection[]
  intersectionKey: string
}

/**
 * Hook to calculate the intersection between organization and customer invoice custom sections.
 * Returns both the intersection array and a stable string key for dependency comparison.
 */
export const useInvoiceCustomSectionsIntersection = ({
  orgInvoiceSections,
  customerInvoiceSections,
}: UseInvoiceCustomSectionsIntersectionProps): UseInvoiceCustomSectionsIntersectionReturn => {
  const orgInvoiceSectionsMemoized = useMemo(() => {
    return orgInvoiceSections || []
  }, [orgInvoiceSections])

  const customerInvoiceSectionsMemoized = useMemo(() => {
    return customerInvoiceSections || []
  }, [customerInvoiceSections])

  const mappedOrgInvoiceSections = useMemo(() => {
    return mapItemsToCustomerInvoiceSections(orgInvoiceSectionsMemoized)
  }, [orgInvoiceSectionsMemoized])

  const mappedCustomerInvoiceSections = useMemo(() => {
    return mapItemsToCustomerInvoiceSections(customerInvoiceSectionsMemoized)
  }, [customerInvoiceSectionsMemoized])

  const intersection = useMemo(() => {
    return getIntersectionOfSections(mappedOrgInvoiceSections, mappedCustomerInvoiceSections)
  }, [mappedOrgInvoiceSections, mappedCustomerInvoiceSections])

  const intersectionKey = useMemo(() => {
    return intersection
      .map((s) => s.id)
      .sort()
      .join(',')
  }, [intersection])

  return {
    intersection,
    intersectionKey,
  }
}
