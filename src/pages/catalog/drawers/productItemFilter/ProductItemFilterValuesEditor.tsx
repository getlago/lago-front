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
  // Undefined means the parent key was selected on its own ("all values" for
  // that billable metric filter); a defined value selects a single value.
  value?: string
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
  // Omitted for the parent-key ("all values") option so it round-trips to an
  // entry with an undefined value.
  value?: string
}

const encodeFilterOptionValue = ({ id, value }: EncodedFilterOptionValue): string =>
  value === undefined ? JSON.stringify({ id }) : JSON.stringify({ id, value })

export const decodeFilterOptionValue = (encodedValue: string): EncodedFilterOptionValue =>
  JSON.parse(encodedValue) as EncodedFilterOptionValue

// Builds the combobox options for the values editor: one parent-key ("all
// values") option per billable metric filter, followed by one option per
// individual value. Selecting the parent key and selecting an individual value
// are mutually exclusive, so each side disables the other:
// - a value option is disabled once its parent key is selected;
// - the parent-key option is disabled once any of its values is selected.
export const buildProductItemFilterComboBoxData = (
  billableMetricFilters: Array<Pick<BillableMetricFilter, 'id' | 'key' | 'values'>>,
  values: ProductItemFilterValueEntry[],
): BasicComboBoxData[] => {
  const selectionByFilterId = new Map<
    string,
    { parentSelected: boolean; hasChildSelected: boolean }
  >()

  for (const entry of values) {
    const current = selectionByFilterId.get(entry.billableMetricFilterId) ?? {
      parentSelected: false,
      hasChildSelected: false,
    }

    if (entry.value === undefined) {
      current.parentSelected = true
    } else {
      current.hasChildSelected = true
    }

    selectionByFilterId.set(entry.billableMetricFilterId, current)
  }

  return billableMetricFilters.flatMap((billableMetricFilter) => {
    const selection = selectionByFilterId.get(billableMetricFilter.id)
    const parentSelected = selection?.parentSelected ?? false
    const hasChildSelected = selection?.hasChildSelected ?? false

    return [
      {
        label: billableMetricFilter.key,
        value: encodeFilterOptionValue({ id: billableMetricFilter.id }),
        disabled: hasChildSelected,
      },
      ...billableMetricFilter.values.map((value) => ({
        label: `${billableMetricFilter.key}: ${value}`,
        value: encodeFilterOptionValue({ id: billableMetricFilter.id, value }),
        disabled: parentSelected,
      })),
    ]
  })
}

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

  const comboBoxData: BasicComboBoxData[] = useMemo(
    () => buildProductItemFilterComboBoxData(billableMetricFilters, values),
    [billableMetricFilters, values],
  )

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
            // Parent-key selection (no value) shows the bare key; a value shows "key: value".
            const label = entry.value === undefined ? key : `${key}: ${entry.value}`

            return (
              <Stack
                key={`${entry.billableMetricFilterId}-${entry.value ?? ''}`}
                direction="row"
                flexWrap="wrap"
                alignItems="center"
                gap={2}
              >
                <Chip
                  label={label}
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
