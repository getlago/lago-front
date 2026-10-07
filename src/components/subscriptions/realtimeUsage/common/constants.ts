import { AggregationTypeEnum, ChargeModelEnum } from '~/generated/graphql'

// Auto-refresh is off by default: polling is opt-in, so an idle usage tab
// stays idle.
export const AUTO_REFRESH_OPTIONS = [0, 1, 5, 10]
// Fewer hours on the axis leave more room per column, so the bar thickens
// with the scale instead of stranding the columns in whitespace. Recharts
// interpolates width as well as height, so the widening is part of the
// rescale rather than a jump once it lands.
export const WINDOWS = [
  { hours: 6, barSize: 56 },
  { hours: 12, barSize: 36 },
  { hours: 24, barSize: 24 },
]
export const DEFAULT_WINDOW_IN_HOURS = 24

export const WINDOW_REFRESH_INTERVAL = 60000

// Mirrors the API gate (`RealtimeUsage.supported_charge?` narrowed to the
// aggregations whose hours add up): any other charge is refused, so it is not
// offered at all. `accepts_target_wallet` is part of that gate too but is not
// exposed on the charge.
export const REALTIME_AGGREGATION_TYPES = [AggregationTypeEnum.CountAgg, AggregationTypeEnum.SumAgg]
export const REALTIME_CHARGE_MODELS = [
  ChargeModelEnum.Standard,
  ChargeModelEnum.Graduated,
  ChargeModelEnum.Package,
  ChargeModelEnum.Volume,
  ChargeModelEnum.GraduatedPercentage,
  ChargeModelEnum.Dynamic,
]

export const DEFAULT_SERIES_KEY = 'default'
export const OTHER_SERIES_KEY = 'other'
