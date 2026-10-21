export const AUTO_REFRESH_OPTIONS = [0, 1, 5, 10]
export const DEFAULT_AUTO_REFRESH = 0

export const AUTO_REFRESH_TRANSLATIONS: Record<number, string> = {
  0: 'text_1787609843960bopfeje8bho',
  1: 'text_1792589422770nemo85meypl',
  5: 'text_1792589422770qchxtdz79qy',
  10: 'text_1792589422770cckzcc8rzov',
}

export const REALTIME_USAGE_CONTROL_CLASSNAME = 'flex-row items-center gap-2'

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
