import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { useGetProductItemsForFilterItemProductItemQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductItemValue,
} from '../types'
import { escapeFilterLabel } from '../utils'

gql`
  query getProductItemsForFilterItemProductItem($page: Int, $limit: Int) {
    productItems(page: $page, limit: $limit) {
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

type FiltersItemProductItemFilterProductItemProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select in the UI, but the `productItemFilters` query only accepts a single
// `productItemId`: formatFiltersForProductItemFiltersQuery keeps only the first
// real selection made here. The "Not defined" option matches the Figma reference
// for visual parity with FiltersItemProductItemFilterProduct, but has no backend
// meaning: a ProductItemFilter always belongs to exactly one product item, so
// selecting it never contributes a productItemId.
export const FiltersItemProductItemFilterProductItem = ({
  value,
  setFilterValue,
}: FiltersItemProductItemFilterProductItemProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductItemsForFilterItemProductItemQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductItemsData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    const productItemOptions = (data?.productItems?.collection ?? [])
      .map((productItem) => {
        const label = productItem.invoiceDisplayName || productItem.name

        return {
          label,
          value: `${productItem.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side (not returned by the API) and pinned on top,
    // matching the Figma reference. It has no query effect on this list.
    return [
      { label: translate('text_1784214117868fh6rndi4m75'), value: filterWithoutProductItemValue },
      ...productItemOptions,
    ]
  }, [data?.productItems?.collection, translate])

  const selectedProductItemsValue = useMemo(
    () =>
      parseLabeledMultiFilterValue({
        value,
        withoutValue: filterWithoutProductItemValue,
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
      data={comboboxProductItemsData}
      onChange={(productItems) => {
        setFilterValue(formatMultiFilterValue(productItems))
      }}
      value={selectedProductItemsValue}
    />
  )
}
