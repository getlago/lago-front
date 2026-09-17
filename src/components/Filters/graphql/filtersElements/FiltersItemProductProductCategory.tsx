import { gql } from '@apollo/client'
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

gql`
  query getProductCategoriesForFilterItemProductCategory($page: Int, $limit: Int) {
    productCategories(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        code
      }
    }
  }
`

type FiltersItemProductProductCategoryProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemProductProductCategory = ({
  value,
  setFilterValue,
}: FiltersItemProductProductCategoryProps) => {
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
    // every productCategory. Selecting it maps to `withoutProductCategory: true` rather than a productCategory id.
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
