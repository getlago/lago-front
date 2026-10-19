import {
  AlertTypeEnum,
  CurrencyEnum,
  GetSubscriptionAlertToEditQuery,
  NotifyOnEnum,
} from '~/generated/graphql'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/alertForm/mappers'
import { TValidatedSubscriptionAlertForm } from '~/pages/alertForm/validationSchema'

const TRIGGERED = [NotifyOnEnum.Triggered]
const TRIGGERED_AND_RESOLVED = [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved]

type ExistingAlert = NonNullable<GetSubscriptionAlertToEditQuery['subscriptionAlert']>

const existingAlert = (overrides: Partial<ExistingAlert> = {}): ExistingAlert => ({
  __typename: 'Alert',
  id: 'alert-1',
  alertType: AlertTypeEnum.CurrentUsageAmount,
  billableMetric: null,
  code: 'my-alert',
  name: 'My alert',
  thresholds: [
    {
      __typename: 'AlertThreshold',
      code: 'first',
      recurring: false,
      value: '1000',
      notifyOn: TRIGGERED,
    },
  ],
  ...overrides,
})

const formValues = (
  overrides: Partial<TValidatedSubscriptionAlertForm> = {},
): TValidatedSubscriptionAlertForm => ({
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.CurrentUsageAmount,
  billableMetricId: '',
  thresholds: [{ code: 'first', recurring: false, value: '10', notifyOn: TRIGGERED }],
  ...overrides,
})

describe('mapFromApiToForm', () => {
  describe('GIVEN no existing alert', () => {
    describe('WHEN building the form values', () => {
      it('THEN should return empty values with a single empty threshold', () => {
        expect(mapFromApiToForm({ currency: CurrencyEnum.Usd, alert: undefined })).toEqual({
          name: '',
          code: '',
          alertType: '',
          billableMetricId: '',
          thresholds: [{ code: '', recurring: false, value: '', notifyOn: TRIGGERED }],
        })
      })
    })
  })

  describe('GIVEN an existing amount alert', () => {
    describe('WHEN building the form values', () => {
      it('THEN should prefill the fields and deserialize the threshold amount', () => {
        expect(
          mapFromApiToForm({
            currency: CurrencyEnum.Usd,
            alert: existingAlert(),
          }),
        ).toEqual({
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.CurrentUsageAmount,
          billableMetricId: '',
          thresholds: [{ code: 'first', recurring: false, value: '10', notifyOn: TRIGGERED }],
        })
      })

      it('THEN should drop the __typename of the edit query', () => {
        const { thresholds } = mapFromApiToForm({
          currency: CurrencyEnum.Usd,
          alert: existingAlert(),
        })

        expect(thresholds[0]).not.toHaveProperty('__typename')
      })
    })
  })

  describe('GIVEN an existing billable-metric alert', () => {
    describe('WHEN building the form values', () => {
      it('THEN should prefill the billable metric id', () => {
        const { billableMetricId } = mapFromApiToForm({
          currency: CurrencyEnum.Usd,
          alert: existingAlert({
            alertType: AlertTypeEnum.BillableMetricCurrentUsageAmount,
            billableMetric: {
              __typename: 'BillableMetric',
              id: 'bm-1',
              code: 'bm_code',
              name: 'BM One',
            },
          }),
        })

        expect(billableMetricId).toBe('bm-1')
      })

      it('THEN should truncate a units threshold instead of deserializing it', () => {
        const { thresholds } = mapFromApiToForm({
          currency: CurrencyEnum.Usd,
          alert: existingAlert({
            alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
            thresholds: [
              {
                __typename: 'AlertThreshold',
                code: 'first',
                recurring: false,
                value: '12.99',
                notifyOn: TRIGGERED,
              },
            ],
          }),
        })

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '12', notifyOn: TRIGGERED },
        ])
      })
    })
  })
})

describe('mapFormToCreateInput', () => {
  describe('GIVEN an amount alert', () => {
    describe('WHEN building the create input', () => {
      it('THEN should serialize the thresholds to cents and omit the empty billable metric', () => {
        expect(mapFormToCreateInput(formValues(), 'subscription-1', CurrencyEnum.Usd)).toEqual({
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.CurrentUsageAmount,
          subscriptionId: 'subscription-1',
          billableMetricId: undefined,
          thresholds: [{ code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED }],
        })
      })
    })
  })

  describe('GIVEN a units alert', () => {
    describe('WHEN building the create input', () => {
      it('THEN should truncate the thresholds to integers and carry the billable metric', () => {
        expect(
          mapFormToCreateInput(
            formValues({
              alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
              billableMetricId: 'bm-1',
              thresholds: [
                { code: 'first', recurring: false, value: '12.99', notifyOn: TRIGGERED },
              ],
            }),
            'subscription-1',
            CurrencyEnum.Usd,
          ),
        ).toEqual({
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.BillableMetricCurrentUsageUnits,
          subscriptionId: 'subscription-1',
          billableMetricId: 'bm-1',
          thresholds: [{ code: 'first', recurring: false, value: '12', notifyOn: TRIGGERED }],
        })
      })
    })
  })

  describe('GIVEN a billable-metric amount alert', () => {
    describe('WHEN building the create input', () => {
      it('THEN should serialize the thresholds to cents', () => {
        const { thresholds } = mapFormToCreateInput(
          formValues({
            alertType: AlertTypeEnum.BillableMetricCurrentUsageAmount,
            billableMetricId: 'bm-1',
          }),
          'subscription-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED },
        ])
      })
    })
  })

  describe('GIVEN a recurring threshold', () => {
    describe('WHEN building the create input', () => {
      it('THEN should keep its recurring flag', () => {
        const { thresholds } = mapFormToCreateInput(
          formValues({
            thresholds: [
              { code: 'first', recurring: false, value: '10', notifyOn: TRIGGERED },
              { code: 'recurring', recurring: true, value: '5', notifyOn: TRIGGERED },
            ],
          }),
          'subscription-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED },
          { code: 'recurring', recurring: true, value: '500', notifyOn: TRIGGERED },
        ])
      })
    })
  })
})

describe('mapFormToUpdateInput', () => {
  describe('GIVEN an existing alert', () => {
    describe('WHEN building the update input', () => {
      it('THEN should carry the id and omit the immutable alertType and subscriptionId', () => {
        expect(mapFormToUpdateInput(formValues(), 'alert-1', CurrencyEnum.Usd)).toEqual({
          id: 'alert-1',
          name: 'My alert',
          code: 'my-alert',
          billableMetricId: undefined,
          thresholds: [{ code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED }],
        })
      })

      it('THEN should carry the billable metric id when the alert has one', () => {
        const { billableMetricId } = mapFormToUpdateInput(
          formValues({
            alertType: AlertTypeEnum.BillableMetricCurrentUsageAmount,
            billableMetricId: 'bm-1',
          }),
          'alert-1',
          CurrencyEnum.Usd,
        )

        expect(billableMetricId).toBe('bm-1')
      })

      it('THEN should still use the alert type to serialize the thresholds', () => {
        const { thresholds } = mapFormToUpdateInput(
          formValues({
            alertType: AlertTypeEnum.BillableMetricLifetimeUsageUnits,
            billableMetricId: 'bm-1',
            thresholds: [{ code: 'first', recurring: false, value: '12.99', notifyOn: TRIGGERED }],
          }),
          'alert-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '12', notifyOn: TRIGGERED },
        ])
      })
    })
  })
})

describe('notifyOn', () => {
  describe('GIVEN an existing threshold notifying when resolved', () => {
    describe('WHEN building the form values', () => {
      it('THEN should prefill its notifyOn', () => {
        const { thresholds } = mapFromApiToForm({
          currency: CurrencyEnum.Usd,

          alert: existingAlert({
            thresholds: [
              {
                __typename: 'AlertThreshold',
                code: 'hard',
                recurring: false,
                value: '1000',
                notifyOn: TRIGGERED_AND_RESOLVED,
              },
            ],
          }),
        })

        expect(thresholds).toEqual([
          { code: 'hard', recurring: false, value: '10', notifyOn: TRIGGERED_AND_RESOLVED },
        ])
      })
    })
  })

  describe('GIVEN thresholds with mixed notifyOn values', () => {
    describe('WHEN building the create input', () => {
      it('THEN should send an explicit, normalized notifyOn on every threshold', () => {
        const values = formValues({
          thresholds: [
            { code: 'warn', recurring: false, value: '10' },
            {
              code: 'hard',
              recurring: false,
              value: '20',
              notifyOn: [NotifyOnEnum.Resolved, NotifyOnEnum.Triggered, NotifyOnEnum.Resolved],
            },
            { code: 'every', recurring: true, value: '5', notifyOn: TRIGGERED_AND_RESOLVED },
          ],
        })

        expect(mapFormToCreateInput(values, 'subscription-1', CurrencyEnum.Usd).thresholds).toEqual(
          [
            { code: 'warn', recurring: false, value: '1000', notifyOn: TRIGGERED },
            { code: 'hard', recurring: false, value: '2000', notifyOn: TRIGGERED_AND_RESOLVED },
            { code: 'every', recurring: true, value: '500', notifyOn: TRIGGERED },
          ],
        )
      })
    })

    describe('WHEN building the update input', () => {
      it('THEN should send notifyOn on every threshold too', () => {
        const { thresholds } = mapFormToUpdateInput(
          formValues({
            thresholds: [
              { code: 'warn', recurring: false, value: '10', notifyOn: TRIGGERED },
              { code: 'hard', recurring: false, value: '20', notifyOn: TRIGGERED_AND_RESOLVED },
            ],
          }),
          'alert-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'warn', recurring: false, value: '1000', notifyOn: TRIGGERED },
          { code: 'hard', recurring: false, value: '2000', notifyOn: TRIGGERED_AND_RESOLVED },
        ])
      })
    })
  })

  describe('GIVEN an alert created before notifyOn existed', () => {
    describe('WHEN it is saved without any change', () => {
      it('THEN should send notifyOn [triggered] on every threshold and nothing else new', () => {
        const formState = mapFromApiToForm({
          currency: CurrencyEnum.Usd,

          alert: existingAlert({
            thresholds: [
              {
                __typename: 'AlertThreshold',
                code: 'warn',
                recurring: false,
                value: '8000',
                notifyOn: TRIGGERED,
              },
              {
                __typename: 'AlertThreshold',
                code: 'every',
                recurring: true,
                value: '5000',
                notifyOn: TRIGGERED,
              },
              {
                __typename: 'AlertThreshold',
                code: 'hard',
                recurring: false,
                value: '10000',
                notifyOn: TRIGGERED,
              },
            ],
          }),
        })

        expect(
          mapFormToUpdateInput(
            { ...formState, alertType: AlertTypeEnum.CurrentUsageAmount },
            'alert-1',
            CurrencyEnum.Usd,
          ),
        ).toEqual({
          id: 'alert-1',
          name: 'My alert',
          code: 'my-alert',
          billableMetricId: undefined,
          thresholds: [
            { code: 'warn', recurring: false, value: '8000', notifyOn: TRIGGERED },
            { code: 'hard', recurring: false, value: '10000', notifyOn: TRIGGERED },
            { code: 'every', recurring: true, value: '5000', notifyOn: TRIGGERED },
          ],
        })
      })
    })
  })
})
