import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductFilterValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductFiltersForFilterItemRateCardProductFilterQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

type FiltersItemAppliedRateCardProductFilterProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select with a synthetic "Not defined" entry: real selections map to a plural
// `productFilterIds` array, the sentinel maps to the standalone `withoutProductFilter: true`
// arg (see the appliedRateCardProductFilter FILTER_VALUE_MAP entry). Reuses the same
// productFilters query as FiltersItemRateCardProductFilter rather than co-locating a
// duplicate.
export const FiltersItemAppliedRateCardProductFilter = ({
  value,
  setFilterValue,
}: FiltersItemAppliedRateCardProductFilterProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductFiltersForFilterItemRateCardProductFilterQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductFiltersData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    const productFilterOptions = (data?.productFilters?.collection ?? [])
      .map((productFilter) => {
        const label = productFilter.invoiceDisplayName || productFilter.name

        return {
          label,
          value: `${productFilter.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side (not returned by the API) and pinned on top of
    // every productFilter. Selecting it maps to `withoutProductFilter: true` rather than a
    // productFilter id.
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
