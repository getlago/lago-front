import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductsForFilterItemProductQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

gql`
  query getProductsForFilterItemProduct($page: Int, $limit: Int) {
    products(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        invoiceDisplayName
      }
    }
  }
`

type FiltersItemProductFilterProductProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select in the UI, but the `productFilters` query only accepts a single
// `productId`: formatFiltersForProductFiltersQuery keeps only the first
// real selection made here. The "Not defined" option matches the Figma reference
// for visual parity with FiltersItemProductFilterProductCategory, but has no backend
// meaning: a ProductFilter always belongs to exactly one productCategory item, so
// selecting it never contributes a productId.
export const FiltersItemProductFilterProduct = ({
  value,
  setFilterValue,
}: FiltersItemProductFilterProductProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductsForFilterItemProductQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductsData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    const productOptions = (data?.products?.collection ?? [])
      .map((product) => {
        const label = product.invoiceDisplayName || product.name

        return {
          label,
          value: `${product.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side (not returned by the API) and pinned on top,
    // matching the Figma reference. It has no query effect on this list.
    return [
      { label: translate('text_1784214117868fh6rndi4m75'), value: filterWithoutProductValue },
      ...productOptions,
    ]
  }, [data?.products?.collection, translate])

  const selectedProductsValue = useMemo(
    () =>
      parseLabeledMultiFilterValue({
        value,
        withoutValue: filterWithoutProductValue,
        withoutValueLabel: translate('text_1784214117868fh6rndi4m75'),
      }),
    [value, translate],
  )

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={translate('text_178458736524240wdfikummz')}
      data={comboboxProductsData}
      onChange={(products) => {
        setFilterValue(formatMultiFilterValue(products))
      }}
      value={selectedProductsValue}
    />
  )
}
