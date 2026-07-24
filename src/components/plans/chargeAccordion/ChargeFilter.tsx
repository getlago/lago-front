import Stack from '@mui/material/Stack'
import { memo, useEffect, useMemo, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { BasicComboBoxData, MultipleComboBox } from '~/components/form'
import {
  ALL_FILTER_VALUES,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_FILTER_FOR_CHARGE_CLASSNAME,
} from '~/core/constants/form'
import { BillableMetricFilter } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalChargeFilterInput } from '../types'
import { transformFilterObjectToString } from '../utils'

// Test ID constants
export const CHARGE_FILTER_VALUES_CONTAINER_TEST_ID = 'charge-filter-values-container'

export const buildChargeFilterAddFilterButtonId = (chargeIndex: number, filterIndex: number) =>
  `charge-${chargeIndex}-add-filter-${filterIndex}`

interface ChargeFilterProps {
  filter: LocalChargeFilterInput
  filterIndex: number
  chargeIndex: number
  billableMetricFilters?: BillableMetricFilter[]
  /** Full value sets of the other filters defined on the same charge */
  otherFiltersValues?: LocalChargeFilterInput['values'][]
  setFilterValues: (values: LocalChargeFilterInput['values']) => void
  deleteFilterValue: (valueIndex: number) => void
}

export const ChargeFilter = memo(
  ({
    filter,
    filterIndex,
    chargeIndex,
    billableMetricFilters,
    otherFiltersValues,
    setFilterValues,
    deleteFilterValue,
  }: ChargeFilterProps) => {
    const { translate } = useInternationalization()
    const [showComboBox, setShowComboBox] = useState(false)
    const hasValuesDefined = Object.keys(filter?.values || {}).length > 0

    // Only warn when another filter on this charge has the *exact same* set of
    // values (e.g. same filter, different price) — a partial overlap is valid.
    const isDuplicateDefinition = useMemo(() => {
      if (!otherFiltersValues?.length || !filter.values.length) return false

      const currentValues = new Set(filter.values)

      return otherFiltersValues.some(
        (values) =>
          values.length === currentValues.size && values.every((v) => currentValues.has(v)),
      )
    }, [otherFiltersValues, filter.values])

    const filterValues: BasicComboBoxData[] = useMemo(() => {
      if (!billableMetricFilters) return []

      return billableMetricFilters.reduce<BasicComboBoxData[]>((acc, cur) => {
        const parentKeyStrigified = transformFilterObjectToString(cur.key)
        let hasAnyChildKeySelected = false

        for (const v of cur.values) {
          if (filter.values.includes(transformFilterObjectToString(cur.key, v))) {
            hasAnyChildKeySelected = true
            break
          }
        }

        return [
          ...acc,
          {
            label: cur.key,
            value: parentKeyStrigified,
            disabled: hasAnyChildKeySelected,
          },
          ...(!!cur.values.length
            ? cur.values.map((value) => {
                return {
                  label: `${cur.key}: ${value}`,
                  value: transformFilterObjectToString(cur.key, value),
                  disabled: filter.values.includes(parentKeyStrigified),
                }
              })
            : []),
        ]
      }, [])
    }, [billableMetricFilters, filter.values])

    useEffect(() => {
      if (showComboBox) {
        // Focus filter combobox and show options
        setTimeout(() => {
          const elements = document.querySelectorAll(
            `.${SEARCH_FILTER_FOR_CHARGE_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
          )
          const elementToFocus = elements[elements.length - 1] as HTMLElement

          if (!elements.length) return

          elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' })
          elementToFocus.click()
        }, 0)
      }
    }, [showComboBox])

    return (
      <div className="flex flex-col gap-3">
        <Typography variant="captionHl" color="grey700">
          {translate('text_65f8472df7593301061e27d3')}
        </Typography>

        {isDuplicateDefinition && (
          <Alert type="warning">{translate('text_17842075995060cc5300kk8j')}</Alert>
        )}

        {hasValuesDefined && (
          <Stack
            data-test={CHARGE_FILTER_VALUES_CONTAINER_TEST_ID}
            direction="row"
            flexWrap="wrap"
            gap={2}
          >
            {filter?.values.map((value, valueIndex) => {
              const formatedValue = Object.entries(JSON.parse(value as string))[0]
              const valueToDisplay = `${formatedValue[0]}${
                !!formatedValue[1] && formatedValue[1] !== ALL_FILTER_VALUES
                  ? `: ${formatedValue[1]}`
                  : ''
              }`

              return (
                <Stack
                  key={`filter-${filterIndex}-value-${valueIndex}`}
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  gap={2}
                >
                  <Chip
                    label={valueToDisplay}
                    deleteIconLabel={translate('text_6261640f28a49700f1290df5')}
                    onDelete={() => {
                      deleteFilterValue(valueIndex)
                    }}
                  />
                  {valueIndex !== Object.keys(filter?.values).length - 1 && (
                    <Typography variant="body" color="grey700">
                      {translate('text_65f8472df7593301061e27d6')}
                    </Typography>
                  )}
                </Stack>
              )
            })}
          </Stack>
        )}

        {!showComboBox ? (
          <div>
            <Button
              id={buildChargeFilterAddFilterButtonId(chargeIndex, filterIndex)}
              variant="inline"
              startIcon="plus"
              onClick={() => {
                setShowComboBox(true)
              }}
            >
              {translate('text_65f8472df7593301061e27dd')}
            </Button>
          </div>
        ) : (
          <Stack
            sx={{
              '> *:first-of-type': {
                flex: 1,
              },
            }}
            direction="row"
            gap={3}
            alignItems="center"
          >
            <MultipleComboBox
              hideTags
              disableClearable
              disableCloseOnSelect
              className={SEARCH_FILTER_FOR_CHARGE_CLASSNAME}
              data={filterValues}
              value={filter?.values.map((value: string) => {
                return {
                  value: value,
                }
              })}
              placeholder={translate('text_65faba06377c5900f5111c95')}
              onChange={(values) => {
                setFilterValues(values.map((v) => v.value))
              }}
            />
            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  setShowComboBox(false)
                }}
              />
            </Tooltip>
          </Stack>
        )}
      </div>
    )
  },
)

ChargeFilter.displayName = 'ChargeFilter'
