import { gql } from '@apollo/client'

import {
  GetInvoiceCustomSectionsQuery,
  useGetInvoiceCustomSectionsLazyQuery,
} from '~/generated/graphql'

gql`
  query getInvoiceCustomSections {
    invoiceCustomSections {
      collection {
        id
        name
        code
      }
    }
  }
`

export type InvoiceCustomSection = NonNullable<
  GetInvoiceCustomSectionsQuery['invoiceCustomSections']
>['collection'][number]

interface UseInvoiceCustomSectionsLazyReturn {
  getInvoiceCustomSections: ReturnType<typeof useGetInvoiceCustomSectionsLazyQuery>[0]
  loading: boolean
  error: boolean
  data: InvoiceCustomSection[]
}

/**
 * Hook to fetch invoice custom sections on demand (lazy loading).
 * Returns a function to trigger the query.
 */
export const useInvoiceCustomSectionsLazy = (): UseInvoiceCustomSectionsLazyReturn => {
  const [getInvoiceCustomSections, { data, loading, error }] =
    useGetInvoiceCustomSectionsLazyQuery()

  const sections = data?.invoiceCustomSections?.collection || []

  return {
    getInvoiceCustomSections,
    loading,
    error: !!error,
    data: sections,
  }
}
