import {
  buildCustomExpressionDefaultValues,
  customExpressionValidationSchema,
} from '../validationSchema'

const INVALID_EXPRESSION = 'event.properties.'

jest.mock('lago-expression', () => ({
  parseExpression: jest.fn((expression: string) => {
    if (expression === INVALID_EXPRESSION) {
      throw new Error('parse error')
    }

    return { expression }
  }),
  evaluateExpression: jest.fn(() => '42'),
}))

const VALID_EXPRESSION = 'event.properties.tokens * 2'

const validPayload = buildCustomExpressionDefaultValues().eventPayload

describe('customExpressionValidationSchema', () => {
  describe('GIVEN an expression', () => {
    describe('WHEN it parses', () => {
      it('THEN should accept the form values', () => {
        const result = customExpressionValidationSchema.safeParse({
          expression: VALID_EXPRESSION,
          eventPayload: validPayload,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN it is empty or unparseable', () => {
      it.each([
        ['an empty expression', ''],
        ['an unparseable expression', INVALID_EXPRESSION],
      ])('THEN should reject %s on the expression field', (_, expression) => {
        const result = customExpressionValidationSchema.safeParse({
          expression,
          eventPayload: validPayload,
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain('expression')
      })
    })
  })

  describe('GIVEN an event payload', () => {
    describe('WHEN it is an object or a parseable JSON string', () => {
      it.each([
        ['an object', validPayload],
        ['a JSON string', JSON.stringify(validPayload)],
      ])('THEN should accept %s', (_, eventPayload) => {
        const result = customExpressionValidationSchema.safeParse({
          expression: VALID_EXPRESSION,
          eventPayload,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN it is empty or malformed JSON', () => {
      it.each([
        ['an empty payload', ''],
        ['a malformed JSON string', '{ "event": '],
      ])('THEN should reject %s on the eventPayload field', (_, eventPayload) => {
        const result = customExpressionValidationSchema.safeParse({
          expression: VALID_EXPRESSION,
          eventPayload,
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain('eventPayload')
      })
    })
  })
})

describe('buildCustomExpressionDefaultValues', () => {
  describe('GIVEN a billable metric code', () => {
    describe('WHEN building the default values', () => {
      it('THEN should seed the sample payload with that code', () => {
        const { eventPayload } = buildCustomExpressionDefaultValues('my_metric')

        expect(eventPayload).toEqual(
          expect.objectContaining({
            event: expect.objectContaining({ code: 'my_metric' }),
          }),
        )
      })
    })
  })

  describe('GIVEN no billable metric code', () => {
    describe('WHEN building the default values', () => {
      it('THEN should seed the sample payload with a placeholder code', () => {
        const { expression, eventPayload } = buildCustomExpressionDefaultValues()

        expect(expression).toBe('')
        expect(eventPayload).toEqual(
          expect.objectContaining({
            event: expect.objectContaining({ code: '__BILLABLE_METRIC_CODE__' }),
          }),
        )
      })
    })
  })
})
