import {
  AggregationTypeEnum,
  EditBillableMetricFragment,
  RoundingFunctionEnum,
} from '~/generated/graphql'
import {
  AggregateOnTab,
  billableMetricDefaultValues,
  BillableMetricFormValues,
  billableMetricValidationSchema,
  buildBillableMetricInput,
  mapFromApiToForm,
} from '~/pages/createBillableMetric/validationSchema'

const VALID_VALUES: BillableMetricFormValues = {
  name: 'My metric',
  code: 'my_metric',
  description: '',
  expression: '',
  aggregationType: AggregationTypeEnum.SumAgg,
  fieldName: 'amount',
  recurring: false,
  aggregateOnTab: AggregateOnTab.UniqueField,
  roundingFunction: undefined,
  roundingPrecision: undefined,
  filters: [],
}

const invalidFields = (overrides: Partial<BillableMetricFormValues> = {}): string[] => {
  const result = billableMetricValidationSchema.safeParse({ ...VALID_VALUES, ...overrides })

  if (result.success) return []

  return [...new Set(result.error.issues.map((issue) => issue.path.join('.')))].sort()
}

const messagesFor = (
  field: string,
  overrides: Partial<BillableMetricFormValues> = {},
): string[] => {
  const result = billableMetricValidationSchema.safeParse({ ...VALID_VALUES, ...overrides })

  if (result.success) return []

  return result.error.issues
    .filter((issue) => issue.path.join('.') === field)
    .map((issue) => issue.message)
}

describe('billableMetricValidationSchema', () => {
  describe('GIVEN a fully filled form', () => {
    describe('WHEN every required field is set', () => {
      it('THEN should report no error', () => {
        expect(invalidFields()).toEqual([])
      })
    })
  })

  describe('GIVEN the always-required fields', () => {
    describe('WHEN name, code or aggregationType is missing', () => {
      it.each([
        ['name', { name: '' }, 'name'],
        ['code', { code: '' }, 'code'],
        ['aggregationType', { aggregationType: undefined }, 'aggregationType'],
      ])('THEN should flag a missing %s', (_label, overrides, expectedField) => {
        expect(invalidFields(overrides as Partial<BillableMetricFormValues>)).toContain(
          expectedField,
        )
      })
    })
  })

  describe('GIVEN the aggregate-on tab drives the expression', () => {
    describe('WHEN the custom expression tab is selected without an expression', () => {
      it('THEN should flag the expression', () => {
        expect(
          invalidFields({ aggregateOnTab: AggregateOnTab.CustomExpression, expression: '' }),
        ).toContain('expression')
      })
    })

    describe('WHEN the unique field tab is selected without an expression', () => {
      it('THEN should not flag the expression', () => {
        expect(
          invalidFields({ aggregateOnTab: AggregateOnTab.UniqueField, expression: '' }),
        ).not.toContain('expression')
      })
    })
  })

  describe('GIVEN the aggregation type drives the field name', () => {
    describe('WHEN an aggregation needing a field name has none', () => {
      it.each([
        AggregationTypeEnum.SumAgg,
        AggregationTypeEnum.UniqueCountAgg,
        AggregationTypeEnum.MaxAgg,
        AggregationTypeEnum.LatestAgg,
        AggregationTypeEnum.WeightedSumAgg,
      ])('THEN should flag the field name for %s', (aggregationType) => {
        expect(invalidFields({ aggregationType, fieldName: '' })).toContain('fieldName')
      })
    })

    describe('WHEN the aggregation needs no field name', () => {
      it.each([AggregationTypeEnum.CountAgg, AggregationTypeEnum.CustomAgg])(
        'THEN should not flag the field name for %s',
        (aggregationType) => {
          expect(invalidFields({ aggregationType, fieldName: '' })).not.toContain('fieldName')
        },
      )
    })
  })

  describe('GIVEN a rounding precision', () => {
    describe('WHEN it holds a number or a numeric string', () => {
      it.each([[2], ['2'], [''], [undefined]])(
        'THEN should accept %p',
        (roundingPrecision: number | string | undefined) => {
          expect(
            invalidFields({
              roundingFunction: RoundingFunctionEnum.Round,
              roundingPrecision,
            }),
          ).toEqual([])
        },
      )
    })

    describe('WHEN it holds a non-numeric string', () => {
      it('THEN should flag the rounding precision', () => {
        expect(
          invalidFields({
            roundingFunction: RoundingFunctionEnum.Round,
            roundingPrecision: 'abc',
          }),
        ).toContain('roundingPrecision')
      })
    })
  })

  describe('GIVEN filters', () => {
    describe('WHEN a filter row is complete', () => {
      it('THEN should report no error', () => {
        expect(invalidFields({ filters: [{ key: 'region', values: [{ value: 'eu' }] }] })).toEqual(
          [],
        )
      })
    })

    describe('WHEN a filter row has no key', () => {
      it('THEN should flag that row key', () => {
        expect(invalidFields({ filters: [{ key: '', values: [{ value: 'eu' }] }] })).toEqual([
          'filters.0.key',
        ])
      })
    })

    describe('WHEN a filter row has no value', () => {
      it('THEN should flag that row values', () => {
        expect(invalidFields({ filters: [{ key: 'region', values: [] }] })).toEqual([
          'filters.0.values',
        ])
      })
    })

    describe('WHEN two filter rows share the same key', () => {
      it('THEN should flag both row keys with the duplicate-key message', () => {
        const filters = [
          { key: 'region', values: [{ value: 'eu' }] },
          { key: 'region', values: [{ value: 'us' }] },
        ]

        expect(invalidFields({ filters })).toEqual(['filters.0.key', 'filters.1.key'])
        expect(messagesFor('filters.0.key', { filters })).toEqual(['text_65eadc457f316200770db19c'])
      })
    })

    describe('WHEN only one of several filter rows is invalid', () => {
      it('THEN should flag that row only', () => {
        expect(
          invalidFields({
            filters: [
              { key: 'region', values: [{ value: 'eu' }] },
              { key: 'plan', values: [] },
            ],
          }),
        ).toEqual(['filters.1.values'])
      })
    })
  })
})

describe('mapFromApiToForm', () => {
  const apiMetric = {
    id: 'bm-1',
    name: 'My metric',
    code: 'my_metric',
    description: 'desc',
    expression: '',
    aggregationType: AggregationTypeEnum.SumAgg,
    fieldName: 'amount',
    hasPlans: false,
    hasSubscriptions: false,
    recurring: false,
    roundingFunction: RoundingFunctionEnum.Round,
    roundingPrecision: 0,
    filters: [{ key: 'region', values: ['eu', 'us'] }],
  } as EditBillableMetricFragment

  describe('GIVEN no metric', () => {
    describe('WHEN mapping', () => {
      it('THEN should return the empty defaults', () => {
        expect(mapFromApiToForm(undefined, false)).toEqual(billableMetricDefaultValues)
      })
    })
  })

  describe('GIVEN a stored metric', () => {
    describe('WHEN mapping for an edition', () => {
      it('THEN should seed filter values as combobox options', () => {
        expect(mapFromApiToForm(apiMetric, false).filters).toEqual([
          { key: 'region', values: [{ value: 'eu' }, { value: 'us' }] },
        ])
      })

      it('THEN should keep a rounding precision of 0', () => {
        expect(mapFromApiToForm(apiMetric, false).roundingPrecision).toBe(0)
      })

      it('THEN should select the custom expression tab only when an expression exists', () => {
        expect(mapFromApiToForm(apiMetric, false).aggregateOnTab).toBe(AggregateOnTab.UniqueField)
        expect(
          mapFromApiToForm({ ...apiMetric, expression: 'round(x)' }, false).aggregateOnTab,
        ).toBe(AggregateOnTab.CustomExpression)
      })

      it('THEN should drop a field name the aggregation cannot use', () => {
        expect(
          mapFromApiToForm({ ...apiMetric, aggregationType: AggregationTypeEnum.CountAgg }, false)
            .fieldName,
        ).toBeUndefined()
      })
    })

    describe('WHEN mapping for a duplication', () => {
      it('THEN should blank the name and the code only', () => {
        const values = mapFromApiToForm(apiMetric, true)

        expect(values.name).toBe('')
        expect(values.code).toBe('')
        expect(values.fieldName).toBe('amount')
      })
    })
  })
})

describe('buildBillableMetricInput', () => {
  const formValues: BillableMetricFormValues = {
    ...VALID_VALUES,
    filters: [{ key: 'region', values: [{ value: 'eu' }, { value: 'us' }] }],
  }

  describe('GIVEN filter values held as combobox options', () => {
    describe('WHEN building the API input', () => {
      it('THEN should flatten them back to bare strings', () => {
        expect(buildBillableMetricInput(formValues).filters).toEqual([
          { key: 'region', values: ['eu', 'us'] },
        ])
      })
    })
  })

  describe('GIVEN a rounding precision', () => {
    describe('WHEN it is 0', () => {
      it('THEN should send 0, not drop it', () => {
        expect(
          buildBillableMetricInput({ ...formValues, roundingPrecision: 0 }).roundingPrecision,
        ).toBe(0)
      })
    })

    describe('WHEN it is an empty string', () => {
      it('THEN should send nothing', () => {
        expect(
          buildBillableMetricInput({ ...formValues, roundingPrecision: '' }).roundingPrecision,
        ).toBeUndefined()
      })
    })

    describe('WHEN it is a numeric string', () => {
      it('THEN should send it as a number', () => {
        expect(
          buildBillableMetricInput({ ...formValues, roundingPrecision: '3' }).roundingPrecision,
        ).toBe(3)
      })
    })
  })

  describe('GIVEN the aggregate-on tab', () => {
    describe('WHEN it is not the custom expression tab', () => {
      it('THEN should null the expression out', () => {
        expect(
          buildBillableMetricInput({
            ...formValues,
            aggregateOnTab: AggregateOnTab.UniqueField,
            expression: 'round(x)',
          }).expression,
        ).toBeNull()
      })
    })

    describe('WHEN it is the custom expression tab', () => {
      it('THEN should keep the expression', () => {
        expect(
          buildBillableMetricInput({
            ...formValues,
            aggregateOnTab: AggregateOnTab.CustomExpression,
            expression: 'round(x)',
          }).expression,
        ).toBe('round(x)')
      })
    })
  })
})
