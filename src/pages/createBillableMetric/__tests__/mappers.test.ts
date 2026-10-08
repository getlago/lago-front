import {
  AggregationTypeEnum,
  EditBillableMetricFragment,
  RoundingFunctionEnum,
} from '~/generated/graphql'
import { mapFromApiToForm, mapFromFormToApi } from '~/pages/createBillableMetric/mappers'
import {
  AggregateOnTab,
  billableMetricDefaultValues,
  BillableMetricFormValues,
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

const ROUND = RoundingFunctionEnum.Round

const buildInput = (overrides: Partial<BillableMetricFormValues> = {}) =>
  mapFromFormToApi({ ...VALID_VALUES, ...overrides })

describe('mapFromFormToApi', () => {
  const formValues: BillableMetricFormValues = {
    ...VALID_VALUES,
    filters: [{ key: 'region', values: [{ value: 'eu' }, { value: 'us' }] }],
  }

  describe('GIVEN filter values held as combobox options', () => {
    describe('WHEN building the API input', () => {
      it('THEN should flatten them back to bare strings', () => {
        expect(mapFromFormToApi(formValues).filters).toEqual([
          { key: 'region', values: ['eu', 'us'] },
        ])
      })
    })
  })

  describe('GIVEN a rounding precision alongside its function', () => {
    describe('WHEN it is 0', () => {
      it('THEN should send 0, not drop it', () => {
        expect(
          buildInput({ roundingFunction: ROUND, roundingPrecision: 0 }).roundingPrecision,
        ).toBe(0)
      })
    })

    describe('WHEN it is an empty string', () => {
      it('THEN should send nothing', () => {
        expect(
          buildInput({ roundingFunction: ROUND, roundingPrecision: '' }).roundingPrecision,
        ).toBeUndefined()
      })
    })

    describe('WHEN it is a numeric string', () => {
      it('THEN should send it as a number', () => {
        expect(
          buildInput({ roundingFunction: ROUND, roundingPrecision: '3' }).roundingPrecision,
        ).toBe(3)
      })
    })
  })

  describe('GIVEN no rounding function', () => {
    describe('WHEN a precision lingers from a cleared function', () => {
      // The precision input is hidden without a function, so sending it would
      // store a value the user can no longer see or clear.
      it('THEN should send no precision', () => {
        expect(
          buildInput({ roundingFunction: undefined, roundingPrecision: 2 }).roundingPrecision,
        ).toBeUndefined()
      })
    })
  })

  describe('GIVEN the aggregate-on tab', () => {
    describe('WHEN it is not the custom expression tab', () => {
      it('THEN should null the expression out', () => {
        expect(
          mapFromFormToApi({
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
          mapFromFormToApi({
            ...formValues,
            aggregateOnTab: AggregateOnTab.CustomExpression,
            expression: 'round(x)',
          }).expression,
        ).toBe('round(x)')
      })
    })
  })
})
