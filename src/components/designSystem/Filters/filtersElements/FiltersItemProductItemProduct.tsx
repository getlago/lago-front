import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { ComboBox } from '~/components/form'
import { useGetProductsForFilterItemProductLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues } from '../types'
import { escapeFilterLabel } from '../utils'

gql`
  query getProductsForFilterItemProduct($page: Int, $limit: Int, $searchTerm: String) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        code
      }
    }
  }
`

type FiltersItemProductItemProductProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemProductItemProduct = ({
  value,
  setFilterValue,
}: FiltersItemProductItemProductProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const [getProducts, { data, loading }] = useGetProductsForFilterItemProductLazyQuery({
    variables: { page: 1, limit: 10 },
  })

  const comboboxProductsData = useMemo(() => {
    if (!data?.products?.collection) return []

    return data.products.collection.map((product) => ({
      label: product.code,
      value: `${product.id}${filterDataInlineSeparator}${escapeFilterLabel(product.code)}`,
    }))
  }, [data?.products?.collection])

  return (
    <ComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      searchQuery={getProducts}
      loading={loading}
      placeholder={translate('text_1783980718113ol49lu59441')}
      data={comboboxProductsData}
      onChange={(productValue) => setFilterValue(productValue)}
      value={value}
    />
  )
}
