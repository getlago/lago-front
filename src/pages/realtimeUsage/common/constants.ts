export const REALTIME_USAGE_FILTERS_TEST_ID = 'realtime-usage-filters'
export const REALTIME_USAGE_REFRESH_BUTTON_TEST_ID = 'realtime-usage-refresh-button'
export const REALTIME_USAGE_BAR_CHART_TEST_ID = 'realtime-usage-bar-chart'
export const REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID = 'realtime-usage-bar-chart-legend'
export const REALTIME_USAGE_ERROR_TEST_ID = 'realtime-usage-error'
export const REALTIME_USAGE_AUTO_REFRESH_TEST_ID = 'realtime-usage-auto-refresh'
export const REALTIME_USAGE_TIME_RANGE_TEST_ID = 'realtime-usage-time-range'
export const REALTIME_USAGE_TIME_RANGE_APPLY_TEST_ID = 'realtime-usage-time-range-apply'

// A dimension key is JSON, which recharts would read as a nested path.
export const SERIES_KEY_PREFIX = 'dimension_'

export const AUTO_REFRESH_SEARCH_PARAM = 'rtu_autoRefresh'
export const TIME_RANGE_SEARCH_PARAM = 'rtu_timeRange'

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
