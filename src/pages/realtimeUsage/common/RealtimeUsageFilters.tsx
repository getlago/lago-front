import { useApolloClient } from '@apollo/client'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { AvailableFiltersEnum, Filters } from '~/components/Filters'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { REALTIME_USAGE_FILTERS_TEST_ID, REALTIME_USAGE_REFRESH_BUTTON_TEST_ID } from './constants'
import { RealtimeUsageAutoRefreshSelector } from './RealtimeUsageAutoRefreshSelector'
import { RealtimeUsageTimeRangeSelector } from './RealtimeUsageTimeRangeSelector'

type RealtimeUsageFiltersProps = {
  availableFilters: AvailableFiltersEnum[]
  // The operations the Refresh button fetches again.
  queryNames: string[]
}

// The filters are kept in the URL like every other report, which also lets them follow the user
// from the overview to a billable metric and back. Auto-refresh and the time range always apply,
// so they are their own controls rather than filters a reset would remove.
export const RealtimeUsageFilters = ({
  availableFilters,
  queryNames,
}: RealtimeUsageFiltersProps): JSX.Element => {
  const { translate } = useInternationalization()
  const client = useApolloClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = async (): Promise<void> => {
    setIsRefreshing(true)

    try {
      await client.refetchQueries({ include: queryNames })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div
      className="flex items-start justify-between gap-4"
      data-test={REALTIME_USAGE_FILTERS_TEST_ID}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <RealtimeUsageAutoRefreshSelector />
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
        loading={isRefreshing}
        onClick={refresh}
      >
        {translate('text_1738748043939zqoqzz350yj')}
      </Button>
    </div>
  )
}
