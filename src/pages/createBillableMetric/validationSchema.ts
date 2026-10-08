import { z } from 'zod'

import {
  AggregationTypeEnum,
  CreateBillableMetricInput,
  EditBillableMetricFragment,
  RoundingFunctionEnum,
} from '~/generated/graphql'

export enum AggregateOnTab {
  UniqueField,
  CustomExpression,
}

const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'
const NOT_A_NUMBER_ERROR = 'text_1791440702706mohkt5xwj1a'
const NOT_UNIQUE_KEY_ERROR = 'text_65eadc457f316200770db19c'

const FIELD_NAME_FREE_AGGREGATIONS = [AggregationTypeEnum.CountAgg, AggregationTypeEnum.CustomAgg]

export const aggregatesOnAField = (aggregationType?: AggregationTypeEnum): boolean =>
  !!aggregationType && !FIELD_NAME_FREE_AGGREGATIONS.includes(aggregationType)

const filterSchema = z.object({
  key: z.string(),
  // `MultipleComboBoxField` stores whole options, not the bare strings the API takes.
  values: z.array(z.looseObject({ value: z.string() })),
})

export const billableMetricValidationSchema = z
  .object({
    name: z.string().min(1, { message: 'text_1771342980565bx64zqq2mjs' }),
    code: z.string().min(1, { message: 'text_1771342994699klxu2paz7g9' }),
    description: z.string(),
    expression: z.string(),
    aggregationType: z
      .enum(AggregationTypeEnum)
      .optional()
      .refine((value) => !!value, { message: REQUIRED_ERROR }),
    fieldName: z.string().optional(),
    recurring: z.boolean(),
    aggregateOnTab: z.enum(AggregateOnTab),
    roundingFunction: z.enum(RoundingFunctionEnum).optional(),
    roundingPrecision: z
      .union([z.number(), z.string()])
      .optional()
      .refine((value) => value === undefined || value === '' || !isNaN(Number(value)), {
        message: NOT_A_NUMBER_ERROR,
      }),
    filters: z.array(filterSchema),
  })
  .refine((data) => data.aggregateOnTab !== AggregateOnTab.CustomExpression || !!data.expression, {
    message: REQUIRED_ERROR,
    path: ['expression'],
  })
  .refine((data) => !aggregatesOnAField(data.aggregationType) || !!data.fieldName, {
    message: REQUIRED_ERROR,
    path: ['fieldName'],
  })
  .superRefine((data, ctx) => {
    if (!Array.isArray(data.filters)) return

    data.filters.forEach((filter, index) => {
      if (!filter?.key) {
        ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['filters', index, 'key'] })

        return
      }

      const isKeyDuplicated = data.filters.filter((other) => other?.key === filter.key).length > 1

      if (isKeyDuplicated) {
        ctx.addIssue({
          code: 'custom',
          message: NOT_UNIQUE_KEY_ERROR,
          path: ['filters', index, 'key'],
        })

        return
      }

      if (!filter.values?.length) {
        ctx.addIssue({
          code: 'custom',
          message: REQUIRED_ERROR,
          path: ['filters', index, 'values'],
        })
      }
    })
  })

export type BillableMetricFormValues = z.infer<typeof billableMetricValidationSchema>

export const billableMetricDefaultValues: BillableMetricFormValues = {
  name: '',
  code: '',
  description: '',
  expression: '',
  aggregationType: undefined,
  fieldName: undefined,
  recurring: false,
  aggregateOnTab: AggregateOnTab.UniqueField,
  roundingFunction: undefined,
  roundingPrecision: undefined,
  filters: [],
}

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

export const buildBillableMetricInput = (
  values: BillableMetricFormValues,
): CreateBillableMetricInput => ({
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
  roundingPrecision:
    values.roundingPrecision === undefined || values.roundingPrecision === ''
      ? undefined
      : Number(values.roundingPrecision),
  expression: values.aggregateOnTab === AggregateOnTab.CustomExpression ? values.expression : null,
})
