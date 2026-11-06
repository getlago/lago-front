import {
  formatMultiFilterValue,
  parseLabeledMultiFilterValue,
} from '~/components/Filters/graphql/filtersElements/utils'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import {
  escapeFilterLabel,
  formatFiltersForQuery,
  keyWithPrefix,
  mapAppliedRateCardProductFilterValue,
} from '~/components/Filters/graphql/utils'
import {
  AvailableFiltersEnum,
  DynamicFilter,
  DynamicFilterKey,
  filterDataInlineSeparator,
  FilterValueInputProps,
  filterWithoutProductFilterValue,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { INVOICE_PRODUCT_FEES_FILTER_PREFIX } from '~/core/constants/filters'
import { InvoiceProductCatalogSectionFragment } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceProductFeesFilters } from './useInvoiceProductFees'

export const INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY: DynamicFilterKey = 'dynamic.product'
export const INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY: DynamicFilterKey =
  'dynamic.productFilter'

const NOT_DEFINED_TRANSLATION_KEY = 'text_1784214117868fh6rndi4m75'

type FilterOption = { label: string; value: string }

const toOption = (id: string, label: string): FilterOption => ({
  label,
  value: `${id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
})

const toSortedUniqueOptions = (items: Array<{ id: string; label: string }>): FilterOption[] =>
  Array.from(new Map(items.map((item) => [item.id, item])).values())
    .map(({ id, label }) => toOption(id, label))
    .sort((a, b) => a.label.localeCompare(b.label))

export const buildInvoiceProductFeesProductOptions = (
  section: InvoiceProductCatalogSectionFragment,
): FilterOption[] =>
  toSortedUniqueOptions(
    section.products.map(({ product }) => ({ id: product.id, label: product.code })),
  )

export const buildInvoiceProductFeesProductFilterOptions = (
  section: InvoiceProductCatalogSectionFragment,
  translate: TranslateFunc,
): FilterOption[] => [
  { label: translate(NOT_DEFINED_TRANSLATION_KEY), value: filterWithoutProductFilterValue },
  ...toSortedUniqueOptions(
    section.products.flatMap(({ filters }) =>
      filters.map(({ productFilter }) => ({
        id: productFilter.id,
        label: productFilter.invoiceDisplayName || productFilter.name,
      })),
    ),
  ),
]

const parseValue = (value: string | undefined, translate: TranslateFunc): FilterOption[] =>
  parseLabeledMultiFilterValue({
    value,
    withoutValue: filterWithoutProductFilterValue,
    withoutValueLabel: translate(NOT_DEFINED_TRANSLATION_KEY),
  })

const MultiSelectFilterInput = ({
  value,
  setFilterValue,
  options,
  placeholder,
}: FilterValueInputProps & {
  options: FilterOption[]
  placeholder: string
}): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  return (
    <MultipleComboBox
      PopperProps={{ displayInDialog }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={placeholder}
      data={options}
      onChange={(items) => setFilterValue(formatMultiFilterValue(items))}
      value={parseValue(value, translate)}
    />
  )
}

export const buildInvoiceProductFeesDynamicFilters = ({
  section,
  translate,
}: {
  section: InvoiceProductCatalogSectionFragment
  translate: TranslateFunc
}): DynamicFilter[] => {
  const formatValue = (value: string): string =>
    parseValue(value, translate)
      .map(({ label }) => label)
      .join(', ')

  return [
    {
      key: INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY,
      label: translate('text_1783020794400si0ioidu0m5'),
      renderValueInput: (props) => (
        <MultiSelectFilterInput
          {...props}
          options={buildInvoiceProductFeesProductOptions(section)}
          placeholder={translate('text_178458736524240wdfikummz')}
        />
      ),
      formatValue,
    },
    {
      key: INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY,
      label: translate('text_1783104239825gamldgumtq0'),
      renderValueInput: (props) => (
        <MultiSelectFilterInput
          {...props}
          options={buildInvoiceProductFeesProductFilterOptions(section, translate)}
          placeholder={translate('text_1784927788140s9l160t42mm')}
        />
      ),
      formatValue,
    },
  ]
}

export const formatInvoiceProductFeesFilters = (
  searchParams: URLSearchParams,
): InvoiceProductFeesFilters => {
  const productValue = searchParams.get(
    keyWithPrefix(INVOICE_PRODUCT_FEES_PRODUCT_FILTER_KEY, INVOICE_PRODUCT_FEES_FILTER_PREFIX),
  )
  const productFilterValue = searchParams.get(
    keyWithPrefix(
      INVOICE_PRODUCT_FEES_PRODUCT_FILTER_FILTER_KEY,
      INVOICE_PRODUCT_FEES_FILTER_PREFIX,
    ),
  )
  const productIds = (productValue ?? '')
    .split(',')
    .filter(Boolean)
    .map((part) => part.split(filterDataInlineSeparator)[0])

  return {
    ...formatFiltersForQuery<InvoiceProductFeesFilters>({
      searchParams,
      keyMap: { [AvailableFiltersEnum.appliedRateCardProductType]: 'productType' },
      availableFilters: [AvailableFiltersEnum.appliedRateCardProductType],
      filtersNamePrefix: INVOICE_PRODUCT_FEES_FILTER_PREFIX,
    }),
    ...(productIds.length > 0 && { productIds }),
    ...(productFilterValue && mapAppliedRateCardProductFilterValue(productFilterValue)),
  }
}
