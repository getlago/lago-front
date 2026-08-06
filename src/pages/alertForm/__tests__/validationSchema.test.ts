import { AlertTypeEnum } from '~/generated/graphql'
import {
  subscriptionAlertValidationSchema,
  TSubscriptionAlertForm,
} from '~/pages/alertForm/validationSchema'

const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'

const validValues = (overrides: Partial<TSubscriptionAlertForm> = {}): TSubscriptionAlertForm => ({
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.CurrentUsageAmount,
  billableMetricId: '',
  thresholds: [{ code: 'threshold-code', recurring: false, value: '100' }],
  ...overrides,
})

const errorsOf = (values: unknown): { path: string; message: string }[] => {
  const result = subscriptionAlertValidationSchema.safeParse(values)

  if (result.success) return []

  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

describe('subscriptionAlertValidationSchema', () => {
  describe('GIVEN a fully filled form', () => {
    describe('WHEN validating it', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues())).toEqual([])
      })
    })
  })

  describe('GIVEN an optional field', () => {
    describe('WHEN the name is left empty', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ name: '' }))).toEqual([])
      })
    })

    describe('WHEN a threshold has no code', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value: '100' }] }))).toEqual(
          [],
        )
      })
    })

    describe('WHEN no billable metric is picked', () => {
      it('THEN should report no error, since the gate on it is indirect', () => {
        expect(
          errorsOf(
            validValues({
              alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
              billableMetricId: '',
            }),
          ),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN a required field left empty', () => {
    describe('WHEN the code is empty', () => {
      it('THEN should report the generic required error on the code', () => {
        expect(errorsOf(validValues({ code: '' }))).toEqual([
          { path: 'code', message: REQUIRED_ERROR },
        ])
      })
    })

    describe.each([
      ['not picked yet', ''],
      ['cleared from the combobox', undefined],
    ])('WHEN the alert type is %s', (_, alertType) => {
      it('THEN should report the generic required error on the alert type', () => {
        expect(errorsOf(validValues({ alertType: alertType as '' | undefined }))).toEqual([
          { path: 'alertType', message: REQUIRED_ERROR },
        ])
      })
    })
  })

  describe('GIVEN a threshold value', () => {
    describe.each([
      ['empty', ''],
      ['not a number', 'abc'],
    ])('WHEN it is %s', (_, value) => {
      it('THEN should report the generic required error on that row', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value }] }))).toEqual([
          { path: 'thresholds.0.value', message: REQUIRED_ERROR },
        ])
      })
    })

    describe.each([
      ['a plain number', '100'],
      ['a decimal', '10.5'],
      ['zero', '0'],
    ])('WHEN it is %s', (_, value) => {
      it('THEN should report no error', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: false, value }] }))).toEqual([])
      })
    })

    describe('WHEN a later row is empty', () => {
      it('THEN should report the error on that row only', () => {
        expect(
          errorsOf(
            validValues({
              thresholds: [
                { recurring: false, value: '100' },
                { recurring: false, value: '' },
              ],
            }),
          ),
        ).toEqual([{ path: 'thresholds.1.value', message: REQUIRED_ERROR }])
      })
    })
  })

  describe('GIVEN a threshold without a recurring flag', () => {
    describe('WHEN validating it', () => {
      it('THEN should report the generic required error on the flag', () => {
        expect(errorsOf(validValues({ thresholds: [{ recurring: null, value: '100' }] }))).toEqual([
          { path: 'thresholds.0.recurring', message: REQUIRED_ERROR },
        ])
      })
    })
  })
})
