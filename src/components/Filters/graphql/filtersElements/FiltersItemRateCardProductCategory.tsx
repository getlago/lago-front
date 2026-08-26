import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductCategoriesForFilterItemProductCategoryQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

type FiltersItemRateCardProductCategoryProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select, array-native: real selections reach the URL/filter state as a plural
// `productCategoryIds` array (see formatFiltersForRateCardsQuery). The `rateCards` query has no
// productCategory-level arg today though, so mapRateCardFilterVars ignores this dimension
// entirely - it is UI-only pending backend support. Reuses the same `productCategories` query
// as FiltersItemProductProductCategory rather than co-locating a duplicate.
export const FiltersItemRateCardProductCategory = ({
  value,
  setFilterValue,
}: FiltersItemRateCardProductCategoryProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductCategoriesForFilterItemProductCategoryQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductCategoriesData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    const productCategoryOptions = (data?.productCategories?.collection ?? [])
      .map((productCategory) => ({
        label: productCategory.code,
        value: `${productCategory.id}${filterDataInlineSeparator}${escapeFilterLabel(productCategory.code)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side (not returned by the API) and pinned on top of
    // every productCategory. Selecting it never contributes an id: the rateCardProductCategory
    // FILTER_VALUE_MAP entry filters it out, and the dimension is UI-only via the adapter.
    return [
      { label: translate('text_1784214117868fh6rndi4m75'), value: filterWithoutProductValue },
      ...productCategoryOptions,
    ]
  }, [data?.productCategories?.collection, translate])

  const selectedProductCategoriesValue = useMemo(
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
      placeholder={translate('text_1783980718113ol49lu59441')}
      data={comboboxProductCategoriesData}
      onChange={(productCategories) => {
        setFilterValue(formatMultiFilterValue(productCategories))
      }}
      value={selectedProductCategoriesValue}
    />
  )
}
