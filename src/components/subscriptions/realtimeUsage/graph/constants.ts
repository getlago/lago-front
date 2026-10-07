import { theme } from '~/styles'

export const REALTIME_USAGE_TEST_ID_PREFIX = 'realtime-usage'
export const REALTIME_USAGE_LIVE_TEST_ID = 'realtime-usage-live'
export const REALTIME_USAGE_EMPTY_TEST_ID = 'realtime-usage-empty'
export const REALTIME_USAGE_LEGEND_TEST_ID = 'realtime-usage-legend'
export const REALTIME_USAGE_TIME_RANGE_TEST_ID = 'realtime-usage-time-range'
export const REALTIME_USAGE_CHART_TEST_ID = 'realtime-usage-chart'

// Categorical series colors, handed out in the order the API ranks the filters
// (biggest first). Validated for colorblind separation and contrast on white.
export const FILTER_COLORS = ['#006CFA', '#F06700', '#5D48D5', '#008559', '#2FC1FE']
// The charge default (events matching no filter) and the folded tail are
// deliberately grey: they are the absence of a filter, not another one.
export const DEFAULT_FILTER_COLOR = theme.palette.grey[500]
export const OTHER_FILTER_COLOR = theme.palette.grey[400]

export const MAX_VISIBLE_FILTERS = 5
export const CURRENT_HOUR_TWEEN_DURATION = 250
export const SCALE_ANIMATION_DURATION = 450
