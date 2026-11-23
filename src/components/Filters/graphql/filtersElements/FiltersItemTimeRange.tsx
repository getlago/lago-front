import { DateTime } from 'luxon'

import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
import { ComboBox } from '~/components/form'
import {
  CUSTOM_TIME_RANGE_TRANSLATION,
  TIME_RANGE_TRANSLATIONS,
  TimeRangeEnum,
} from '~/components/realtimeUsage/constants'
import { isTimeRangePreset } from '~/components/realtimeUsage/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const CUSTOM_VALUE = 'custom'

type FiltersItemTimeRangeProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemTimeRange = ({
  value,
  setFilterValue,
}: FiltersItemTimeRangeProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { timezoneConfig } = useOrganizationInfos()
  const isCustom = !!value && !isTimeRangePreset(value)

  const lastWeek = (): string => {
    const today = DateTime.now().setZone(timezoneConfig.name)

    return `${today.minus({ days: 6 }).startOf('day').toISO()},${today.endOf('day').toISO()}`
  }

  return (
    <div className="flex flex-col gap-3">
      <ComboBox
        disableClearable
        sortValues={false}
        placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
        data={[
          ...Object.values(TimeRangeEnum).map((preset) => ({
            value: preset,
            label: translate(TIME_RANGE_TRANSLATIONS[preset]),
          })),
          { value: CUSTOM_VALUE, label: translate(CUSTOM_TIME_RANGE_TRANSLATION) },
        ]}
        onChange={(selected) => setFilterValue(selected === CUSTOM_VALUE ? lastWeek() : selected)}
        value={isCustom ? CUSTOM_VALUE : value}
      />

      {isCustom && (
        <DateRangeFilterFields
          defaultZone={timezoneConfig.name}
          disableFutureFromDate
          value={value}
          setFilterValue={setFilterValue}
        />
      )}
    </div>
  )
}
