import { Button } from '~/components/designSystem/Button'
import { AvailableFiltersEnum, Filters } from '~/components/Filters'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { REALTIME_USAGE_FILTERS_TEST_ID, REALTIME_USAGE_REFRESH_BUTTON_TEST_ID } from './constants'
import { REALTIME_USAGE_STATIC_FILTERS } from './useRealtimeUsageControls'

type RealtimeUsageFiltersProps = {
  availableFilters: AvailableFiltersEnum[]
  onRefresh: () => void
}

export const RealtimeUsageFilters = ({
  availableFilters,
  onRefresh,
}: RealtimeUsageFiltersProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div
      className="flex items-center justify-between gap-4"
      data-test={REALTIME_USAGE_FILTERS_TEST_ID}
    >
      <Filters.Provider
        filtersNamePrefix={REALTIME_USAGE_FILTER_PREFIX}
        availableFilters={availableFilters}
        staticFilters={REALTIME_USAGE_STATIC_FILTERS}
        buttonOpener={({ onClick }) => (
          <Button startIcon="filter" size="small" variant="quaternary" onClick={onClick}>
            {translate('text_66ab42d4ece7e6b7078993ad')}
          </Button>
        )}
      >
        <Filters.Component className="min-w-0 flex-1" />
      </Filters.Provider>

      <Button
        data-test={REALTIME_USAGE_REFRESH_BUTTON_TEST_ID}
        variant="inline"
        onClick={onRefresh}
      >
        {translate('text_1738748043939zqoqzz350yj')}
      </Button>
    </div>
  )
}
