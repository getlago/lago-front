import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { ScopedFilterOption } from '~/components/Filters/presentation/types'
import {
  GetContractUsageCategoriesQuery,
  useGetContractUsageCategoriesQuery,
} from '~/generated/graphql'
import { useRefetchOnTokenChange } from '~/hooks/useRefetchOnTokenChange'

gql`
  query getContractUsageCategories($contractId: ID!) {
    contract(id: $contractId) {
      id
      appliedRateCards {
        id
        product {
          id
          name
          invoiceDisplayName
          productCategory {
            id
            name
            invoiceDisplayName
          }
        }
        rateCard {
          id
          productFilter {
            id
            name
            invoiceDisplayName
          }
        }
      }
    }
  }
`

export type ContractUsageCategory = {
  id: string
  name: string
  displayName: string
}

export type ContractUsageFilterOptions = {
  products: ScopedFilterOption[]
  productFilters: ScopedFilterOption[]
}

type AppliedRateCard = NonNullable<
  GetContractUsageCategoriesQuery['contract']
>['appliedRateCards'][number]

type UseContractUsageCategoriesReturn = {
  categories: ContractUsageCategory[]
  hasStandaloneProducts: boolean
  isResolved: boolean
  hasError: boolean
  refetch: () => void
  getFilterOptions: (categoryId: string | null) => ContractUsageFilterOptions | undefined
}

const STANDALONE_KEY = 'standalone'

const toUniqueOptions = (options: ScopedFilterOption[]): ScopedFilterOption[] =>
  Array.from(new Map(options.map((option) => [option.id, option])).values())

const buildFilterOptions = (cards: AppliedRateCard[]): ContractUsageFilterOptions => ({
  products: toUniqueOptions(
    cards.map(({ product }) => ({
      id: product.id,
      label: product.invoiceDisplayName || product.name,
    })),
  ),
  productFilters: toUniqueOptions(
    cards.flatMap(({ rateCard: { productFilter } }) =>
      productFilter
        ? [{ id: productFilter.id, label: productFilter.invoiceDisplayName || productFilter.name }]
        : [],
    ),
  ),
})

export const useContractUsageCategories = ({
  contractId,
  refreshToken,
}: {
  contractId: string
  refreshToken?: number
}): UseContractUsageCategoriesReturn => {
  const { data, error, refetch } = useGetContractUsageCategoriesQuery({ variables: { contractId } })

  useRefetchOnTokenChange(refreshToken, refetch)

  const { categories, cardsByView } = useMemo(() => {
    const categoriesById = new Map<string, ContractUsageCategory>()
    const cardsByViewKey = new Map<string, AppliedRateCard[]>()

    data?.contract?.appliedRateCards.forEach((card) => {
      const category = card.product.productCategory
      const viewKey = category?.id ?? STANDALONE_KEY

      cardsByViewKey.set(viewKey, [...(cardsByViewKey.get(viewKey) ?? []), card])

      if (category) {
        categoriesById.set(category.id, {
          id: category.id,
          name: category.name,
          displayName: category.invoiceDisplayName || category.name,
        })
      }
    })

    return {
      categories: Array.from(categoriesById.values()).toSorted((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      ),
      cardsByView: cardsByViewKey,
    }
  }, [data])

  const getFilterOptions = (categoryId: string | null): ContractUsageFilterOptions | undefined => {
    if (!data?.contract) return undefined

    return buildFilterOptions(cardsByView.get(categoryId ?? STANDALONE_KEY) ?? [])
  }

  return {
    categories,
    hasStandaloneProducts: cardsByView.has(STANDALONE_KEY),
    isResolved: !!data || !!error,
    hasError: !!error,
    refetch,
    getFilterOptions,
  }
}
