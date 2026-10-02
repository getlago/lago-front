export const RATE_TIERS_ADD_TIER_TEST_ID = 'rate-tiers-add-tier'
export const RATE_TIER_LABEL_TEST_ID = 'rate-tier-label'
export const RATE_TIER_UP_TO_TEST_ID = 'rate-tier-up-to'
export const RATE_TIER_INFINITE_UP_TO_TEST_ID = 'rate-tier-infinite-up-to'
export const RATE_TIER_PER_UNIT_TEST_ID = 'rate-tier-per-unit'
export const RATE_TIER_FLAT_FEE_TEST_ID = 'rate-tier-flat-fee'
export const RATE_TIERS_EXAMPLE_TOTAL_TEST_ID = 'rate-tiers-example-total'
export const RATE_TIERS_EXAMPLE_LINE_TEST_ID = 'rate-tiers-example-line'
export const RATE_TIER_RATE_TEST_ID = 'rate-tier-rate'

export const getRateTierTestId = (testId: string, index: number): string => `${testId}-${index}`
