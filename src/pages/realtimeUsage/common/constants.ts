import { theme } from '~/styles'

export const REALTIME_USAGE_FILTERS_TEST_ID = 'realtime-usage-filters'
export const REALTIME_USAGE_REFRESH_BUTTON_TEST_ID = 'realtime-usage-refresh-button'
export const REALTIME_USAGE_BAR_CHART_TEST_ID = 'realtime-usage-bar-chart'
export const REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID = 'realtime-usage-bar-chart-legend'
export const REALTIME_USAGE_ERROR_TEST_ID = 'realtime-usage-error'

export const DIMENSION_COLORS = [
  theme.palette.primary[500],
  theme.palette.info[300],
  theme.palette.secondary[600],
  theme.palette.success[300],
  theme.palette.secondary[400],
]
export const DEFAULT_DIMENSION_COLOR = theme.palette.grey[500]
export const OTHER_DIMENSION_COLOR = theme.palette.grey[400]

// A dimension key is JSON, which recharts would read as a nested path.
export const SERIES_KEY_PREFIX = 'dimension_'
