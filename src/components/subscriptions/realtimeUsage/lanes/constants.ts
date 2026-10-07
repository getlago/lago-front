import { theme } from '~/styles'

import { SortMode } from './types'

export const REALTIME_LANES_TEST_ID_PREFIX = 'realtime-usage-lanes'
export const REALTIME_LANES_LIVE_TEST_ID = 'realtime-usage-lanes-live'
export const REALTIME_LANES_EMPTY_TEST_ID = 'realtime-usage-lanes-empty'
export const REALTIME_LANES_SORT_TEST_ID = 'realtime-usage-lanes-sort'
export const REALTIME_LANES_LIST_TEST_ID = 'realtime-usage-lanes-list'
export const REALTIME_LANES_LANE_TEST_ID = 'realtime-usage-lane'
export const REALTIME_LANES_LANE_NAME_TEST_ID = 'realtime-usage-lane-name'

// Small multiples, not a stack: every lane carries the same single hue and
// identity comes from the row label, so a twentieth filter costs no palette.
// The charge default (events matching no filter) and the tail the API folds
// into "Other" are grey because they are not a filter of their own.
export const LANE_COLOR = theme.palette.primary.main
export const DEFAULT_LANE_COLOR = theme.palette.grey[500]

export const SPARK_VIEWBOX_WIDTH = 240
export const LANE_SPARK_HEIGHT = 34
export const TOTAL_SPARK_HEIGHT = 52

export const SORT_MODES: SortMode[] = ['volume', 'name']
