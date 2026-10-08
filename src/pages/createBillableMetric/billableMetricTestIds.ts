// Data test ids for the billable metric form – shared with e2e.
// `submit`, `show-description`, `add-filter`, `recurring-switch` and
// `aggregate-on-switch` keep their historical values: `t30-create-bm.cy.ts` and
// `cypress/support/e2e.ts` select on them.

export const FILTER_VALUE_WARNING_ALERT_TEST_ID = 'billable-metric-filter-value-warning'
export const BILLABLE_METRIC_NAME_INPUT_TEST_ID = 'billable-metric-name-input'
export const BILLABLE_METRIC_CODE_INPUT_TEST_ID = 'billable-metric-code-input'
export const BILLABLE_METRIC_AGGREGATION_TYPE_TEST_ID = 'billable-metric-aggregation-type'
export const BILLABLE_METRIC_FIELD_NAME_INPUT_TEST_ID = 'billable-metric-field-name-input'
export const BILLABLE_METRIC_ADD_ROUNDING_TEST_ID = 'billable-metric-add-rounding'
export const BILLABLE_METRIC_REMOVE_ROUNDING_TEST_ID = 'billable-metric-remove-rounding'
export const BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID = 'billable-metric-rounding-function'
export const BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID = 'billable-metric-rounding-precision'
export const BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID = 'billable-metric-filter-key-input'
export const BILLABLE_METRIC_SHOW_DESCRIPTION_TEST_ID = 'show-description'
export const BILLABLE_METRIC_ADD_FILTER_TEST_ID = 'add-filter'
export const BILLABLE_METRIC_SUBMIT_TEST_ID = 'submit'
export const BILLABLE_METRIC_RECURRING_SWITCH_TEST_ID = 'recurring-switch'
export const BILLABLE_METRIC_AGGREGATE_ON_SWITCH_TEST_ID = 'aggregate-on-switch'

export const getBillableMetricFilterTestId = (testId: string, index: number): string =>
  `${testId}-${index}`
