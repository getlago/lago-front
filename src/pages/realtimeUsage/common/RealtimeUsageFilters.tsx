import { Button } from '~/components/designSystem/Button'
import { AvailableFiltersEnum, Filters } from '~/components/Filters'
import { AutoRefreshSelector } from '~/components/realtimeUsage/AutoRefreshSelector'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  REALTIME_USAGE_AUTO_REFRESH_TEST_ID,
  REALTIME_USAGE_FILTERS_TEST_ID,
  REALTIME_USAGE_REFRESH_BUTTON_TEST_ID,
} from './constants'
import { RealtimeUsageTimeRangeSelector } from './RealtimeUsageTimeRangeSelector'
import { useRealtimeUsageControls } from './useRealtimeUsageControls'

type RealtimeUsageFiltersProps = {
  availableFilters: AvailableFiltersEnum[]
  onRefresh: () => void
}

export const RealtimeUsageFilters = ({
  availableFilters,
  onRefresh,
}: RealtimeUsageFiltersProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { autoRefreshSeconds, setAutoRefreshSeconds } = useRealtimeUsageControls()

  return (
    <div
      className="flex items-start justify-between gap-4"
      data-test={REALTIME_USAGE_FILTERS_TEST_ID}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <AutoRefreshSelector
          data-test={REALTIME_USAGE_AUTO_REFRESH_TEST_ID}
          value={autoRefreshSeconds}
          onChange={setAutoRefreshSeconds}
        />
        <RealtimeUsageTimeRangeSelector />

        <Filters.Provider
          filtersNamePrefix={REALTIME_USAGE_FILTER_PREFIX}
          availableFilters={availableFilters}
          buttonOpener={({ onClick }) => (
            <Button startIcon="filter" size="small" variant="quaternary" onClick={onClick}>
              {translate('text_66ab42d4ece7e6b7078993ad')}
            </Button>
          )}
        >
          <Filters.Component className="w-auto flex-1" />
        </Filters.Provider>
      </div>

      <Button
        data-test={REALTIME_USAGE_REFRESH_BUTTON_TEST_ID}
        variant="quaternary"
        size="small"
        startIcon="reload"
        onClick={onRefresh}
      >
        {translate('text_1738748043939zqoqzz350yj')}
      </Button>
    </div>
  )
}
