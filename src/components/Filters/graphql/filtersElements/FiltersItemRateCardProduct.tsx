import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import { filterDataInlineSeparator, FiltersFormValues } from '~/components/Filters/presentation/types'
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
// `productIds` array (see formatFiltersForRateCardsQuery). The `rateCards` query only
// accepts a singular `productId` today, so mapRateCardFilterVars keeps only the first
// selection when calling the query - see that adapter for details. Reuses the same
// `products` query as FiltersItemProductFilterProduct rather than co-locating a duplicate.
export const FiltersItemRateCardProduct = ({
  value,
  setFilterValue,
}: FiltersItemRateCardProductProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductsForFilterItemProductQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductsData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    return (data?.products?.collection ?? [])
      .map((product) => {
        const label = product.invoiceDisplayName || product.name

        return {
          label,
          value: `${product.id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [data?.products?.collection])

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
