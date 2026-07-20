import { useMemo } from 'react'

import { useFilters } from '~/components/designSystem/Filters/useFilters'
import { MultipleComboBox } from '~/components/form'
import { useGetProductsForFilterItemProductQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues, filterWithoutProductValue } from '../types'
import { escapeFilterLabel, unescapeFilterLabel } from '../utils'

type FiltersItemProductItemFilterProductProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// UI-only pending backend support: the `productItemFilters` query only accepts
// `productItemId` + `searchTerm` today (see formatFiltersForProductItemFiltersQuery,
// which deliberately excludes this filter), so a selection made here never reaches
// the API. Built to match the Figma reference, which mirrors the product-item
// list's Product filter (FiltersItemProductItemProduct) exactly, including reusing
// the same `products` query.
export const FiltersItemProductItemFilterProduct = ({
  value,
  setFilterValue,
}: FiltersItemProductItemFilterProductProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data } = useGetProductsForFilterItemProductQuery({
    variables: { page: 1, limit: 500 },
  })

  const comboboxProductsData = useMemo(() => {
    // Freshly mapped array (never a prop/state), so sorting in place is safe.
    const productOptions = (data?.products?.collection ?? [])
      .map((product) => ({
        label: product.code,
        value: `${product.id}${filterDataInlineSeparator}${escapeFilterLabel(product.code)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    // "Not defined" is injected client-side (not returned by the API) and pinned on top of
    // every product, matching the Figma reference. It has no query effect on this list.
    return [
      { label: translate('text_1784214117868fh6rndi4m75'), value: filterWithoutProductValue },
      ...productOptions,
    ]
  }, [data?.products?.collection, translate])

  const selectedProductsValue = useMemo(
    () =>
      (value ?? '')
        .split(',')
        .filter((v) => !!v)
        .map((v) => ({
          label:
            v === filterWithoutProductValue
              ? translate('text_1784214117868fh6rndi4m75')
              : unescapeFilterLabel(
                  v.split(filterDataInlineSeparator)[1] || v.split(filterDataInlineSeparator)[0],
                ),
          value: v,
        })),
    [value, translate],
  )

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={translate('text_1783980718113ol49lu59441')}
      data={comboboxProductsData}
      onChange={(products) => {
        setFilterValue(String(products.map((v) => v.value).join(',')))
      }}
      value={selectedProductsValue}
    />
  )
}
