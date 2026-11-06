import { gql } from '@apollo/client'
import { useSearchParams } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination'
import { INVOICE_PRODUCT_FEES_FILTER_PREFIX } from '~/core/constants/filters'
import { useNavigate } from '~/core/router'
import {
  FeeForViewFeeDetailsDrawerFragmentDoc,
  GetInvoiceProductFeesQueryVariables,
  InvoiceProductCatalogContractFragment,
  InvoiceProductCatalogSectionFragment,
  useGetInvoiceProductFeesLazyQuery,
} from '~/generated/graphql'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

gql`
  fragment InvoiceProductCatalogSection on InvoiceProductCatalogSection {
    productCategory {
      id
      code
      name
      invoiceDisplayName
    }
    products {
      amountCents
      feesCount
      product {
        id
        code
        name
        invoiceDisplayName
        productType
      }
      filters {
        amountCents
        feesCount
        productFilter {
          id
          code
          name
          invoiceDisplayName
        }
      }
    }
  }

  fragment InvoiceProductCatalogContract on InvoiceProductCatalogContract {
    contract {
      id
      name
      plan {
        id
        name
        invoiceDisplayName
      }
    }
    productCatalogSections {
      ...InvoiceProductCatalogSection
    }
  }

  fragment FeeForInvoiceProductCatalogSection on Fee {
    id
    ...FeeForViewFeeDetailsDrawer
    preciseUnitAmount
    currency
    rateModel
    product {
      id
      code
      name
      invoiceDisplayName
      productType
      productCategory {
        id
        code
        name
        invoiceDisplayName
      }
    }
    productFilter {
      id
      code
      name
      invoiceDisplayName
    }
    contract {
      id
    }
    contractRateCard {
      id
      rateCard {
        id
        code
        name
        billingTiming
        displayOnInvoice
      }
    }
    rateOverride {
      id
    }
    trueUpParentFee {
      id
      productFilter {
        id
      }
    }
  }

  query getInvoiceProductFees(
    $invoiceId: ID!
    $contractId: ID
    $productCategoryId: ID
    $standaloneProducts: Boolean
    $searchTerm: String
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $withoutProductFilter: Boolean
    $productType: ProductTypeEnum
    $page: Int
    $limit: Int
  ) {
    invoiceProductFees(
      invoiceId: $invoiceId
      contractId: $contractId
      productCategoryId: $productCategoryId
      standaloneProducts: $standaloneProducts
      searchTerm: $searchTerm
      productIds: $productIds
      productFilterIds: $productFilterIds
      withoutProductFilter: $withoutProductFilter
      productType: $productType
      page: $page
      limit: $limit
    ) {
      collection {
        ...FeeForInvoiceProductCatalogSection
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${FeeForViewFeeDetailsDrawerFragmentDoc}
`

export const INVOICE_PRODUCT_FEES_PAGE_SIZE = 100
export const INVOICE_PRODUCT_CATALOG_SECTION_SEARCH_PARAM = 'section'

export type InvoiceProductCatalogSectionItem = InvoiceProductCatalogSectionFragment & {
  key: string
  contract: InvoiceProductCatalogContractFragment['contract']
}

export const buildInvoiceProductCatalogSections = (
  contracts: InvoiceProductCatalogContractFragment[],
): InvoiceProductCatalogSectionItem[] =>
  contracts.flatMap(({ contract, productCatalogSections }) =>
    productCatalogSections.map((section) => ({
      ...section,
      contract,
      key: `${contract.id}:${section.productCategory?.id ?? 'standalone'}`,
    })),
  )

export const resolveActiveSectionKey = (
  sections: InvoiceProductCatalogSectionItem[],
  rawKey: string | null,
): string | undefined => sections.find(({ key }) => key === rawKey)?.key ?? sections[0]?.key

export type InvoiceProductFeesFilters = Pick<
  GetInvoiceProductFeesQueryVariables,
  'productIds' | 'productFilterIds' | 'withoutProductFilter' | 'productType'
>

type UseInvoiceProductFeesReturn = ReturnType<typeof useGetInvoiceProductFeesLazyQuery>[1] & {
  page: number
  goToPage: (page: number) => void
  selectSection: (key: string) => void
  onSearchChange: (value: string) => void
}

export const useInvoiceProductFees = ({
  invoiceId,
  section,
  filters = {},
}: {
  invoiceId: string
  section: InvoiceProductCatalogSectionItem
  filters?: InvoiceProductFeesFilters
}): UseInvoiceProductFeesReturn => {
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sectionVariables = section.productCategory
    ? { productCategoryId: section.productCategory.id }
    : { standaloneProducts: true }
  const [getFees, result] = useGetInvoiceProductFeesLazyQuery({
    variables: {
      ...filters,
      ...sectionVariables,
      invoiceId,
      contractId: section.contract.id,
      page,
      limit: INVOICE_PRODUCT_FEES_PAGE_SIZE,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getFees, result.loading)

  const selectSection = (key: string): void => {
    const next = new URLSearchParams(searchParams)

    next.set(INVOICE_PRODUCT_CATALOG_SECTION_SEARCH_PARAM, key)
    next.delete('page')
    Array.from(next.keys())
      .filter((searchKey) => searchKey.startsWith(`${INVOICE_PRODUCT_FEES_FILTER_PREFIX}_`))
      .forEach((searchKey) => next.delete(searchKey))
    navigate({ search: next.toString() }, { replace: true })
  }

  const onSearchChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  return { ...result, loading: isLoading, page, goToPage, selectSection, onSearchChange }
}
