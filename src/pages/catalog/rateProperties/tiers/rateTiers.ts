export const RATE_TIER_UP_TO_KEY = 'text_17908879231882xquji7dat9'
export const RATE_TIER_FIRST_LABEL_KEY = 'text_1790887923188zkz50zctwn0'
export const RATE_TIER_NEXT_LABEL_KEY = 'text_1790887923188ftf3no9cjov'
export const RATE_TIER_TOTAL_UNITS_LABEL_KEY = 'text_6304e74aab6dbc18d615f3a2'

export const getTierLabelKey = (index: number): string =>
  index === 0 ? RATE_TIER_FIRST_LABEL_KEY : RATE_TIER_NEXT_LABEL_KEY
