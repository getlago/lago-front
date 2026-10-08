import {
  AggregationTypeEnum,
  CreateBillableMetricInput,
  EditBillableMetricFragment,
} from '~/generated/graphql'

import {
  AggregateOnTab,
  aggregatesOnAField,
  billableMetricDefaultValues,
  BillableMetricFormValues,
} from './validationSchema'

export const mapFromApiToForm = (
  billableMetric: EditBillableMetricFragment | undefined,
  isDuplicate: boolean,
): BillableMetricFormValues => {
  if (!billableMetric) return billableMetricDefaultValues

  const aggregationType = billableMetric.aggregationType || undefined

  return {
    name: isDuplicate ? '' : billableMetric.name || '',
    code: isDuplicate ? '' : billableMetric.code || '',
    description: billableMetric.description || '',
    expression: billableMetric.expression || '',
    aggregationType,
    fieldName: aggregatesOnAField(aggregationType)
      ? billableMetric.fieldName || undefined
      : undefined,
    recurring: billableMetric.recurring || false,
    aggregateOnTab: billableMetric.expression
      ? AggregateOnTab.CustomExpression
      : AggregateOnTab.UniqueField,
    roundingFunction: billableMetric.roundingFunction || undefined,
    roundingPrecision: billableMetric.roundingPrecision ?? undefined,
    filters: (billableMetric.filters || []).map((filter) => ({
      key: filter.key,
      values: (filter.values || []).map((value) => ({ value })),
    })),
  }
}

const toRoundingPrecision = (value: number | string | undefined): number | undefined =>
  value === undefined || value === '' ? undefined : Number(value)

export const mapFromFormToApi = (values: BillableMetricFormValues): CreateBillableMetricInput => ({
  name: values.name,
  code: values.code,
  description: values.description,
  // Only ever empty while the form is being filled: the schema requires it before submit.
  aggregationType: values.aggregationType as AggregationTypeEnum,
  fieldName: values.fieldName,
  recurring: values.recurring,
  filters: values.filters.map((filter) => ({
    key: filter.key,
    values: filter.values.map(({ value }) => value),
  })),
  roundingFunction: values.roundingFunction,
  // Without a function the precision input is hidden, so sending it would store a
  // value the user can no longer see or clear.
  roundingPrecision: !values.roundingFunction
    ? undefined
    : toRoundingPrecision(values.roundingPrecision),
  expression: values.aggregateOnTab === AggregateOnTab.CustomExpression ? values.expression : null,
})
