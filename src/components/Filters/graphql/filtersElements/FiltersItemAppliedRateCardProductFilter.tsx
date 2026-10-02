import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductFilterValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductFiltersForFilterItemAppliedRateCardProductFilterQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

gql`
  query getProductFiltersForFilterItemAppliedRateCardProductFilter($page: Int, $limit: Int) {
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

type FiltersItemAppliedRateCardProductFilterProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemAppliedRateCardProductFilter = ({
  value,
  setFilterValue,
}: FiltersItemAppliedRateCardProductFilterProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductFiltersForFilterItemAppliedRateCardProductFilterQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductFiltersData = useMemo(() => {
    const productFilterOptions = (data?.productFilters?.collection ?? [])
      .map((productFilter) => {
        const label = productFilter.invoiceDisplayName || productFilter.name

        return {
          label,
          value: `${productFilter.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side; selecting it maps to `withoutProductFilter: true`.
    return [
      {
        label: translate('text_1784214117868fh6rndi4m75'),
        value: filterWithoutProductFilterValue,
      },
      ...productFilterOptions,
    ]
  }, [data?.productFilters?.collection, translate])

  const selectedProductFiltersValue = useMemo(
    () =>
      parseLabeledMultiFilterValue({
        value,
        withoutValue: filterWithoutProductFilterValue,
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
      placeholder={translate('text_1784927788140s9l160t42mm')}
      data={comboboxProductFiltersData}
      onChange={(productFilters) => {
        setFilterValue(formatMultiFilterValue(productFilters))
      }}
      value={selectedProductFiltersValue}
    />
  )
}
