import {
  DEFAULT_FILTER_COLOR,
  FILTER_COLORS,
  OTHER_FILTER_COLOR,
} from '~/components/subscriptions/realtimeUsage/graph/constants'

export const REALTIME_USAGE_FILTERS_TEST_ID = 'realtime-usage-filters'
export const REALTIME_USAGE_REFRESH_BUTTON_TEST_ID = 'realtime-usage-refresh-button'
export const REALTIME_USAGE_BAR_CHART_TEST_ID = 'realtime-usage-bar-chart'
export const REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID = 'realtime-usage-bar-chart-legend'
export const REALTIME_USAGE_ERROR_TEST_ID = 'realtime-usage-error'

// The subscription usage graph's palette, handed out in the order the API ranks the dimensions
// (biggest first). The usage of no dimension and the folded tail stay grey.
export const DIMENSION_COLORS = FILTER_COLORS
export const DEFAULT_DIMENSION_COLOR = DEFAULT_FILTER_COLOR
export const OTHER_DIMENSION_COLOR = OTHER_FILTER_COLOR

// A dimension key is JSON, which recharts would read as a nested path, so series are keyed on
// their rank instead.
export const SERIES_KEY_PREFIX = 'dimension_'

export const CHART_HEIGHT = 200

export const REALTIME_USAGE_AUTO_REFRESH_TEST_ID = 'realtime-usage-auto-refresh'
export const REALTIME_USAGE_TIME_RANGE_TEST_ID = 'realtime-usage-time-range'
export const REALTIME_USAGE_TIME_RANGE_APPLY_TEST_ID = 'realtime-usage-time-range-apply'

// Kept in the URL next to the filters, so they survive a reload and follow the user from the
// overview to a billable metric and back, but they are not filters: they always apply.
export const AUTO_REFRESH_SEARCH_PARAM = 'rtu_autoRefresh'
export const TIME_RANGE_SEARCH_PARAM = 'rtu_timeRange'

export enum AutoRefreshEnum {
  Off = '0',
  OneSecond = '1',
  FiveSeconds = '5',
  TenSeconds = '10',
}

export const AUTO_REFRESH_TRANSLATIONS: Record<AutoRefreshEnum, string> = {
  [AutoRefreshEnum.Off]: 'text_17925005807272o134qq3x0e',
  [AutoRefreshEnum.OneSecond]: 'text_1792500580727ntyzce7l4s4',
  [AutoRefreshEnum.FiveSeconds]: 'text_1792500580727vwuvpo7vlhq',
  [AutoRefreshEnum.TenSeconds]: 'text_17925005807272froh7p4w2z',
}

// Polling is opt-in, so an idle tab stays idle.
export const DEFAULT_AUTO_REFRESH = AutoRefreshEnum.Off

// A custom range is stored as its `from,to` ISO bounds rather than as one of these values.
export enum TimeRangeEnum {
  Last6h = 'last_6h',
  Last12h = 'last_12h',
  Last24h = 'last_24h',
}

export const TIME_RANGE_HOURS: Record<TimeRangeEnum, number> = {
  [TimeRangeEnum.Last6h]: 6,
  [TimeRangeEnum.Last12h]: 12,
  [TimeRangeEnum.Last24h]: 24,
}

export const TIME_RANGE_TRANSLATIONS: Record<TimeRangeEnum, string> = {
  [TimeRangeEnum.Last6h]: 'text_179250058072776nv1z2ag7y',
  [TimeRangeEnum.Last12h]: 'text_1792500580727en2xypmfp98',
  [TimeRangeEnum.Last24h]: 'text_1792500580727gdsaipakh25',
}

export const CUSTOM_TIME_RANGE_TRANSLATION = 'text_1792500580727y65tsmyciku'

export const DEFAULT_TIME_RANGE = TimeRangeEnum.Last24h
