import { z } from 'zod'

import { AggregationTypeEnum, RoundingFunctionEnum } from '~/generated/graphql'

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

// `Number('  ')` is 0, so a blank-but-not-empty input would otherwise read as a
// valid zero. An emptied field stays valid: the precision is optional.
const isValidRoundingPrecision = (value: number | string | undefined): boolean => {
  if (value === undefined || value === '') return true
  if (typeof value === 'string' && !value.trim()) return false

  return !isNaN(Number(value))
}

const filterSchema = z.object({
  key: z.string(),
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
      .refine(isValidRoundingPrecision, { message: NOT_A_NUMBER_ERROR }),
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
