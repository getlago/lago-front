import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  AvailableFiltersEnum,
  filterDataInlineSeparator,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductsForFilterItemProductQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

type FiltersItemRateCardProductProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// Multi-select, array-native: real selections reach the URL/filter state as a plural
// `productIds` array (see formatFiltersForRateCardsQuery), which the `rateCards` query
// accepts directly. Reuses the same `products` query as FiltersItemProductFilterProduct
// rather than co-locating a duplicate.
export const FiltersItemRateCardProduct = ({
  value,
  setFilterValue,
}: FiltersItemRateCardProductProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog, optionsByFilter } = useFilters()
  const scopedOptions = optionsByFilter?.[AvailableFiltersEnum.rateCardProduct]

  const { data } = useGetProductsForFilterItemProductQuery({
    variables: { page: 1, limit: 500 },
    skip: !!scopedOptions,
  })

  const comboboxProductsData = useMemo(() => {
    const options =
      scopedOptions ??
      (data?.products?.collection ?? []).map((product) => ({
        id: product.id,
        label: product.invoiceDisplayName || product.name,
      }))

    return options
      .map(({ id, label }) => ({
        label,
        value: `${id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [data?.products?.collection, scopedOptions])

  const selectedProductsValue = useMemo(() => parseLabeledMultiFilterValue({ value }), [value])

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
