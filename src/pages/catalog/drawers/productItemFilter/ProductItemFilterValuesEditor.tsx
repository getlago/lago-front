import Stack from '@mui/material/Stack'
import { useMemo } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData, MultipleComboBox } from '~/components/form'
import { BillableMetricFilter } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const PRODUCT_ITEM_FILTER_VALUES_COMBOBOX_TEST_ID = 'product-item-filter-values-combobox'

export type ProductItemFilterValueEntry = {
  billableMetricFilterId: string
  value: string
}

export type ProductItemFilterValuesEditorProps = {
  billableMetricFilters: Array<Pick<BillableMetricFilter, 'id' | 'key' | 'values'>>
  values: ProductItemFilterValueEntry[]
  onChange: (values: ProductItemFilterValueEntry[]) => void
  disabled?: boolean
  hasError?: boolean
}

type EncodedFilterOptionValue = {
  id: string
  value: string
}

const encodeFilterOptionValue = ({ id, value }: EncodedFilterOptionValue): string =>
  JSON.stringify({ id, value })

const decodeFilterOptionValue = (encodedValue: string): EncodedFilterOptionValue =>
  JSON.parse(encodedValue) as EncodedFilterOptionValue

const ProductItemFilterValuesEditor = ({
  billableMetricFilters,
  values,
  onChange,
  disabled,
  hasError,
}: ProductItemFilterValuesEditorProps) => {
  const { translate } = useInternationalization()

  const billableMetricFilterById = useMemo(() => {
    return new Map(
      billableMetricFilters.map((billableMetricFilter) => [
        billableMetricFilter.id,
        billableMetricFilter,
      ]),
    )
  }, [billableMetricFilters])

  const comboBoxData: BasicComboBoxData[] = useMemo(() => {
    return billableMetricFilters.flatMap((billableMetricFilter) =>
      billableMetricFilter.values.map((value) => ({
        label: `${billableMetricFilter.key}: ${value}`,
        value: encodeFilterOptionValue({ id: billableMetricFilter.id, value }),
      })),
    )
  }, [billableMetricFilters])

  const comboBoxValue = useMemo(() => {
    return values.map((entry) => ({
      value: encodeFilterOptionValue({ id: entry.billableMetricFilterId, value: entry.value }),
    }))
  }, [values])

  const deleteValueAtIndex = (indexToRemove: number) => {
    onChange(values.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="flex flex-col gap-3">
      {!!values.length && (
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {values.map((entry, index) => {
            const key = billableMetricFilterById.get(entry.billableMetricFilterId)?.key ?? ''

            return (
              <Stack
                key={`${entry.billableMetricFilterId}-${entry.value}`}
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                gap={2}
              >
                <Chip
                  label={`${key}: ${entry.value}`}
                  deleteIconLabel={translate('text_6261640f28a49700f1290df5')}
                  onDelete={() => deleteValueAtIndex(index)}
                />
                {index !== values.length - 1 && (
                  <Typography variant="body" color="grey700">
                    {translate('text_65f8472df7593301061e27d6')}
                  </Typography>
                )}
              </Stack>
            )
          })}
        </Stack>
      )}

      <div data-test={PRODUCT_ITEM_FILTER_VALUES_COMBOBOX_TEST_ID}>
        <MultipleComboBox
          hideTags
          disableClearable
          disableCloseOnSelect
          disabled={disabled}
          error={hasError}
          data={comboBoxData}
          value={comboBoxValue}
          placeholder={translate('text_65faba06377c5900f5111c95')}
          onChange={(selectedOptions) => {
            onChange(
              selectedOptions.map((option) => {
                const decodedOptionValue = decodeFilterOptionValue(option.value)

                return {
                  billableMetricFilterId: decodedOptionValue.id,
                  value: decodedOptionValue.value,
                }
              }),
            )
          }}
        />
      </div>
    </div>
  )
}

export default ProductItemFilterValuesEditor
