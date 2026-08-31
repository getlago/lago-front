import { useMemo } from 'react'

import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
  filterWithoutProductCategoryValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { useGetProductCategoriesForFilterItemProductCategoryQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatMultiFilterValue, parseLabeledMultiFilterValue } from './utils'

import { escapeFilterLabel } from '../utils'

type FiltersItemProductFilterProductCategoryProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// UI-only pending backend support: the `productFilters` query only accepts
// `productId` + `searchTerm` today (see formatFiltersForProductFiltersQuery,
// which deliberately excludes this filter), so a selection made here never reaches
// the API. Built to match the Figma reference, which mirrors the product-item
// list's ProductCategory filter (FiltersItemProductProductCategory) exactly, including reusing
// the same `productCategories` query.
export const FiltersItemProductFilterProductCategory = ({
  value,
  setFilterValue,
}: FiltersItemProductFilterProductCategoryProps) => {
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
    // every productCategory, matching the Figma reference. It has no query effect on this list.
    return [
      {
        label: translate('text_1784214117868fh6rndi4m75'),
        value: filterWithoutProductCategoryValue,
      },
      ...productCategoryOptions,
    ]
  }, [data?.productCategories?.collection, translate])

  const selectedProductCategoriesValue = useMemo(
    () =>
      parseLabeledMultiFilterValue({
        value,
        withoutValue: filterWithoutProductCategoryValue,
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
