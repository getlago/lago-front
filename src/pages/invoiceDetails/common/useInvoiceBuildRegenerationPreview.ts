import { gql } from '@apollo/client'

import {
  FeeForInvoiceDetailsTableFragmentDoc,
  useGetInvoiceBuildRegenerationPreviewQuery,
} from '~/generated/graphql'

gql`
  fragment FeeForCustomerInvoiceRegenerate on Fee {
    id
    appliedTaxes {
      id
      taxCode
    }
  }

  query getInvoiceBuildRegenerationPreview($id: ID!) {
    invoiceBuildRegenerationPreview(id: $id) {
      id
      ...AllInvoiceDetailsForCustomerInvoiceDetails

      fees {
        ...FeeDetailsForInvoiceOverview
        ...FeeForInvoiceDetailsTable
        ...FeeForInvoiceDetailsTableFooter
      }
    }
  }

  ${FeeForInvoiceDetailsTableFragmentDoc}
`

export const useInvoiceBuildRegenerationPreview = (invoiceId?: string) => {
  const { data, loading, error } = useGetInvoiceBuildRegenerationPreviewQuery({
    variables: { id: invoiceId as string },
    skip: !invoiceId,
    fetchPolicy: 'cache-and-network',
  })

  return {
    data,
    error,
    invoiceBuildRegenerationPreview: data?.invoiceBuildRegenerationPreview,
    loading,
  }
}
