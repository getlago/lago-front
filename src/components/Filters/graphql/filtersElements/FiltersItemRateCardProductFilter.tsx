import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import { filterDataInlineSeparator, FiltersFormValues } from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductFiltersForFilterItemRateCardProductFilterQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

gql`
  query getProductFiltersForFilterItemRateCardProductFilter($page: Int, $limit: Int) {
    productFilters(page: $page, limit: $limit) {
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

type FiltersItemRateCardProductFilterProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select, array-native: real selections reach the URL/filter state as a plural
// `productFilterIds` array (see formatFiltersForRateCardsQuery). The `rateCards` query
// only accepts a singular `productFilterId` today, so mapRateCardFilterVars keeps only
// the first selection when calling the query - see that adapter for details.
export const FiltersItemRateCardProductFilter = ({
  value,
  setFilterValue,
}: FiltersItemRateCardProductFilterProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductFiltersForFilterItemRateCardProductFilterQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductFiltersData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    return (data?.productFilters?.collection ?? [])
      .map((productFilter) => {
        const label = productFilter.invoiceDisplayName || productFilter.name

        return {
          label,
          value: `${productFilter.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [data?.productFilters?.collection])

  const selectedProductFiltersValue = useMemo(
    () => parseLabeledMultiFilterValue({ value }),
    [value],
  )

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={translate('text_1784927788140s9l160t42mm')}
      data={comboboxProductFiltersData}
      onChange={(productFilters) => {
        setFilterValue(formatMultiFilterValue(productFilters))
      }}
      value={selectedProductFiltersValue}
    />
  )
}
