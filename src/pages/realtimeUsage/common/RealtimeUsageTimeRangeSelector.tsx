import { DateTime } from 'luxon'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { MenuPopper } from '~/styles'

import {
  CUSTOM_TIME_RANGE_TRANSLATION,
  REALTIME_USAGE_TIME_RANGE_APPLY_TEST_ID,
  REALTIME_USAGE_TIME_RANGE_TEST_ID,
  TIME_RANGE_TRANSLATIONS,
  TimeRangeEnum,
} from './constants'
import { isTimeRangePreset, useRealtimeUsageControls } from './useRealtimeUsageControls'
import { isApplicableRange } from './utils'

export const RealtimeUsageTimeRangeSelector = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { timezone, timezoneConfig } = useOrganizationInfos()
  const { timeRange, setTimeRange } = useRealtimeUsageControls()
  const isCustom = !isTimeRangePreset(timeRange)

  const [customDraft, setCustomDraft] = useState<string>()
  const isEditingCustom = customDraft !== undefined

  const defaultCustomRange = (): string => {
    if (isCustom) return timeRange

    const today = DateTime.now().setZone(timezoneConfig.name)

    return `${today.minus({ days: 6 }).startOf('day').toISO()},${today.endOf('day').toISO()}`
  }

  const label = (): string => {
    if (isTimeRangePreset(timeRange)) return translate(TIME_RANGE_TRANSLATIONS[timeRange])

    return timeRange
      .split(',')
      .map((bound) => intlFormatDateTime(bound, { timezone, formatDate: DateFormat.DATE_MED }).date)
      .join(' - ')
  }

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      onClickAway={() => setCustomDraft(undefined)}
      opener={
        <Button
          data-test={REALTIME_USAGE_TIME_RANGE_TEST_ID}
          variant="secondary"
          size="small"
          startIcon="calendar"
          endIcon="chevron-down"
        >
          {`${translate('text_1792500580727rat9rs1dr3a')}: ${label()}`}
        </Button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper>
          {Object.values(TimeRangeEnum).map((option) => (
            <Button
              key={`realtime-usage-time-range-${option}`}
              variant="quaternary"
              align="space-between"
              endIcon={option === timeRange && !isEditingCustom ? 'checkmark' : undefined}
              onClick={() => {
                setTimeRange(option)
                setCustomDraft(undefined)
                closePopper()
              }}
            >
              {translate(TIME_RANGE_TRANSLATIONS[option])}
            </Button>
          ))}
          <Button
            variant="quaternary"
            align="space-between"
            endIcon={isCustom || isEditingCustom ? 'checkmark' : undefined}
            onClick={() => setCustomDraft(defaultCustomRange())}
          >
            {translate(CUSTOM_TIME_RANGE_TRANSLATION)}
          </Button>

          {isEditingCustom && (
            <div className="flex flex-col gap-3 p-2">
              <DateRangeFilterFields
                defaultZone={timezoneConfig.name}
                disableFutureFromDate
                value={customDraft}
                setFilterValue={setCustomDraft}
              />
              <Button
                data-test={REALTIME_USAGE_TIME_RANGE_APPLY_TEST_ID}
                size="small"
                disabled={!isApplicableRange(customDraft)}
                onClick={() => {
                  if (!isApplicableRange(customDraft)) return

                  setTimeRange(customDraft)
                  setCustomDraft(undefined)
                  closePopper()
                }}
              >
                {translate('text_66ab42d4ece7e6b7078993c1')}
              </Button>
            </div>
          )}
        </MenuPopper>
      )}
    </Popper>
  )
}
