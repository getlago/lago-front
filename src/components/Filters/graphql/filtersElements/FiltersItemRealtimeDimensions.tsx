import { gql } from '@apollo/client'
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
import { useGetDimensionNamesForFilterItemRealtimeDimensionsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getDimensionNamesForFilterItemRealtimeDimensions($billableMetricCode: String!) {
    realtimeUsageDimensionNames(billableMetricCode: $billableMetricCode) {
      key
      name
    }
  }
`

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

  // Without bounds, `realtimeUsageDimensionNames` reads the longest window a report allows.
  const { data } = useGetDimensionNamesForFilterItemRealtimeDimensionsQuery({
    variables: { billableMetricCode },
    skip: !billableMetricCode,
  })

  const comboboxData = useMemo(
    () =>
      (data?.realtimeUsageDimensionNames || []).map((dimension) => {
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
