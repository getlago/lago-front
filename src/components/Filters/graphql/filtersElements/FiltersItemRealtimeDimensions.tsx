import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { useParams } from 'react-router'

import {
  encodeRealtimeDimensionKey,
  escapeFilterLabel,
  unescapeFilterLabel,
} from '~/components/Filters/graphql/utils'
import {
  filterDataInlineSeparator,
  FiltersFormValues,
} from '~/components/Filters/presentation/types'
import { MultipleComboBox } from '~/components/form'
import { REALTIME_USAGE_MAX_DAYS } from '~/core/constants/realtimeUsage'
import { useGetDimensionsForFilterItemRealtimeDimensionsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getDimensionsForFilterItemRealtimeDimensions(
    $billableMetricCode: String!
    $fromDatetime: ISO8601DateTime
    $limit: Int
  ) {
    realtimeUsageDimensions(
      billableMetricCode: $billableMetricCode
      fromDatetime: $fromDatetime
      limit: $limit
    ) {
      collection {
        key
        name
      }
    }
  }
`

// The API pages its dimensions by 100 at most: the biggest ones are offered.
const DIMENSIONS_LIMIT = 100

type FiltersItemRealtimeDimensionsProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemRealtimeDimensions = ({
  value,
  setFilterValue,
}: FiltersItemRealtimeDimensionsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { billableMetricCode = '' } = useParams()

  // Offer every value seen over the longest window the reports can show, so the options do not
  // depend on the time range picked in the next row.
  const fromDatetime = useMemo(
    () =>
      DateTime.now()
        .minus({ days: REALTIME_USAGE_MAX_DAYS - 1 })
        .startOf('day')
        .toISO(),
    [],
  )

  const { data } = useGetDimensionsForFilterItemRealtimeDimensionsQuery({
    variables: { billableMetricCode, fromDatetime, limit: DIMENSIONS_LIMIT },
    skip: !billableMetricCode,
  })

  const comboboxData = useMemo(
    () =>
      (data?.realtimeUsageDimensions.collection || []).map((dimension) => {
        const label = dimension.name || translate('text_17876075026872bdz1e5aeep')

        return {
          label,
          value: `${encodeRealtimeDimensionKey(dimension.key)}${filterDataInlineSeparator}${escapeFilterLabel(label)}`,
        }
      }),
    [data, translate],
  )

  return (
    <MultipleComboBox
      disableClearable
      placeholder={translate('text_1792500580727siznh9n5vxx')}
      data={comboboxData}
      onChange={(dimensions) => {
        setFilterValue(dimensions.map((dimension) => dimension.value).join(','))
      }}
      value={value
        ?.split(',')
        .filter((dimension) => !!dimension)
        .map((dimension) => ({
          label: unescapeFilterLabel(
            dimension.split(filterDataInlineSeparator)[1] ||
              dimension.split(filterDataInlineSeparator)[0],
          ),
          value: dimension,
        }))}
    />
  )
}
