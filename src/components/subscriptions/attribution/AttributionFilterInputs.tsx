import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem/Typography'
import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { escapeFilterLabel, unescapeFilterLabel } from '~/components/Filters/graphql/utils'
import { DynamicFilter, FilterValueInputProps } from '~/components/Filters/presentation/types'
import { ComboBox, MultipleComboBox } from '~/components/form'
import { DateFormat, getTimezoneConfig, intlFormatDateTime } from '~/core/timezone'
import { TimezoneEnum, useGetAttributionFilterValuesQuery } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

import {
  ATTRIBUTION_TIME_RANGE_FILTER_KEY,
  AttributionSubscriptionPeriod,
  AttributionTimeRangeEnum,
  getAttributionEntityFilterKey,
  getAttributionTimeRangeType,
  hasAttributionPastPeriod,
  isAttributionTimeRangeValid,
  splitAttributionFilterValues,
} from './attributionFilters'

export const ATTRIBUTION_TIME_RANGE_HINT_TEST_ID = 'attribution-time-range-hint'

const ATTRIBUTION_FILTER_VALUES_LIMIT = 100
const ATTRIBUTION_FILTER_MAX_VALUES = 20

gql`
  query getAttributionFilterValues($subscriptionId: ID!, $groupBy: String!, $limit: Int) {
    attributedUsage(subscriptionId: $subscriptionId, groupBy: $groupBy, limit: $limit) {
      rows {
        value
      }
    }
  }
`

const TIME_RANGE_VALUE_BY_TYPE: Record<AttributionTimeRangeEnum, string> = {
  [AttributionTimeRangeEnum.current]: AttributionTimeRangeEnum.current,
  [AttributionTimeRangeEnum.past]: AttributionTimeRangeEnum.past,
  [AttributionTimeRangeEnum.custom]: ',',
}

const ATTRIBUTION_TIME_RANGE_LABEL_BY_TYPE: Record<AttributionTimeRangeEnum, string> = {
  [AttributionTimeRangeEnum.current]: 'text_1778841363033djjc5c8dsvx',
  [AttributionTimeRangeEnum.past]: 'text_1792764705907ayn0xi2qmjf',
  [AttributionTimeRangeEnum.custom]: 'text_6641dd21c0cffd005b5e2a8b',
}

type AttributionTimeRangeFilterInputProps = FilterValueInputProps & {
  hasPastPeriod: boolean
}

export const AttributionTimeRangeFilterInput = ({
  value,
  setFilterValue,
  hasPastPeriod,
}: AttributionTimeRangeFilterInputProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()
  const type = getAttributionTimeRangeType(value)

  const options = Object.values(AttributionTimeRangeEnum)
    .filter((option) => hasPastPeriod || option !== AttributionTimeRangeEnum.past)
    .map((option) => ({
      value: option,
      label: translate(ATTRIBUTION_TIME_RANGE_LABEL_BY_TYPE[option]),
    }))

  return (
    <div className="flex flex-col gap-2">
      <ComboBox
        disableClearable
        PopperProps={{ displayInDialog }}
        data={options}
        value={type}
        onChange={(nextType) => {
          const nextOption = options.find((option) => option.value === nextType)

          if (!nextOption || nextOption.value === type) return

          setFilterValue(TIME_RANGE_VALUE_BY_TYPE[nextOption.value])
        }}
      />
      {type === AttributionTimeRangeEnum.custom && (
        <>
          <DateRangeFilterFields
            defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
            setFilterValue={setFilterValue}
            value={value}
          />
          <Typography
            variant="caption"
            color="grey600"
            data-test={ATTRIBUTION_TIME_RANGE_HINT_TEST_ID}
          >
            {translate('text_1792764705907y00tsrxiqsl')}
          </Typography>
        </>
      )}
    </div>
  )
}

type AttributionEntityFilterInputProps = FilterValueInputProps & {
  subscriptionId: string
  typeCode: string
  canListValues: boolean
}

export const AttributionEntityFilterInput = ({
  value,
  setFilterValue,
  subscriptionId,
  typeCode,
  canListValues,
}: AttributionEntityFilterInputProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilters()

  const { data, loading } = useGetAttributionFilterValuesQuery({
    variables: { subscriptionId, groupBy: typeCode, limit: ATTRIBUTION_FILTER_VALUES_LIMIT },
    skip: !canListValues,
  })

  const options = (data?.attributedUsage.rows ?? [])
    .filter((row) => !!row.value)
    .map((row) => ({ value: escapeFilterLabel(row.value), label: row.value }))

  return (
    <MultipleComboBox
      freeSolo
      disableClearable
      disableCloseOnSelect
      loading={loading}
      PopperProps={{ displayInDialog }}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={options}
      value={(value ?? '')
        .split(',')
        .filter((entry) => !!entry)
        .map((entry) => ({ value: entry, label: unescapeFilterLabel(entry) }))}
      onChange={(selected) =>
        setFilterValue(selected.map((entry) => escapeFilterLabel(entry.value)).join(','))
      }
    />
  )
}

type AttributionFilterType = { id: string; code: string; name?: string | null }

const formatTimeRange = (value: string, translate: TranslateFunc): string => {
  const type = getAttributionTimeRangeType(value)

  if (type !== AttributionTimeRangeEnum.custom) {
    return translate(ATTRIBUTION_TIME_RANGE_LABEL_BY_TYPE[type])
  }

  return value
    .split(',')
    .map(
      (bound) =>
        intlFormatDateTime(bound, { formatDate: DateFormat.DATE_SHORT, setZone: true }).date,
    )
    .join(' - ')
}

export const buildAttributionDynamicFilters = ({
  translate,
  subscriptionId,
  subscription,
  flatTypes,
  hierarchicalTypes,
  rootTypes,
}: {
  translate: TranslateFunc
  subscriptionId: string
  subscription?: AttributionSubscriptionPeriod | null
  flatTypes: AttributionFilterType[]
  hierarchicalTypes: AttributionFilterType[]
  rootTypes: AttributionFilterType[]
}): DynamicFilter[] => {
  const hasPastPeriod = hasAttributionPastPeriod(subscription)

  const entityTypes = [
    ...flatTypes.map((type) => ({ type, canListValues: true })),
    ...hierarchicalTypes.map((type) => ({
      type,
      canListValues: rootTypes.some((rootType) => rootType.id === type.id),
    })),
  ]

  return [
    {
      key: ATTRIBUTION_TIME_RANGE_FILTER_KEY,
      label: translate('text_1787610177631jhuc7lxfw1v'),
      renderValueInput: (props) => (
        <AttributionTimeRangeFilterInput {...props} hasPastPeriod={hasPastPeriod} />
      ),
      formatValue: (value) => formatTimeRange(value, translate),
      isValueValid: isAttributionTimeRangeValid,
    },
    ...entityTypes.map(({ type, canListValues }): DynamicFilter => ({
      key: getAttributionEntityFilterKey(type.code),
      label: type.name || type.code,
      renderValueInput: (props) => (
        <AttributionEntityFilterInput
          {...props}
          subscriptionId={subscriptionId}
          typeCode={type.code}
          canListValues={canListValues}
        />
      ),
      formatValue: (value) => splitAttributionFilterValues(value).join(', '),
      isValueValid: (value) =>
        splitAttributionFilterValues(value).length <= ATTRIBUTION_FILTER_MAX_VALUES,
    })),
  ]
}
