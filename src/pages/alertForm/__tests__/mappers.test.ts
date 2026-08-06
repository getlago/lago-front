import { AlertTypeEnum, CurrencyEnum, GetSubscriptionAlertToEditQuery } from '~/generated/graphql'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/alertForm/mappers'
import { TValidatedSubscriptionAlertForm } from '~/pages/alertForm/validationSchema'

type ExistingAlert = NonNullable<GetSubscriptionAlertToEditQuery['subscriptionAlert']>

const existingAlert = (overrides: Partial<ExistingAlert> = {}): ExistingAlert => ({
  __typename: 'Alert',
  id: 'alert-1',
  alertType: AlertTypeEnum.CurrentUsageAmount,
  billableMetric: null,
  code: 'my-alert',
  name: 'My alert',
  thresholds: [{ __typename: 'AlertThreshold', code: 'first', recurring: false, value: '1000' }],
  ...overrides,
})

const formValues = (
  overrides: Partial<TValidatedSubscriptionAlertForm> = {},
): TValidatedSubscriptionAlertForm => ({
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.CurrentUsageAmount,
  billableMetricId: '',
  thresholds: [{ code: 'first', recurring: false, value: '10' }],
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
          thresholds: [{ code: '', recurring: false, value: '' }],
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
          thresholds: [{ code: 'first', recurring: false, value: '10' }],
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
              { __typename: 'AlertThreshold', code: 'first', recurring: false, value: '12.99' },
            ],
          }),
        })

        expect(thresholds).toEqual([{ code: 'first', recurring: false, value: '12' }])
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
          thresholds: [{ code: 'first', recurring: false, value: '1000' }],
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
              thresholds: [{ code: 'first', recurring: false, value: '12.99' }],
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
          thresholds: [{ code: 'first', recurring: false, value: '12' }],
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

        expect(thresholds).toEqual([{ code: 'first', recurring: false, value: '1000' }])
      })
    })
  })

  describe('GIVEN a recurring threshold', () => {
    describe('WHEN building the create input', () => {
      it('THEN should keep its recurring flag', () => {
        const { thresholds } = mapFormToCreateInput(
          formValues({
            thresholds: [
              { code: 'first', recurring: false, value: '10' },
              { code: 'recurring', recurring: true, value: '5' },
            ],
          }),
          'subscription-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '1000' },
          { code: 'recurring', recurring: true, value: '500' },
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
          thresholds: [{ code: 'first', recurring: false, value: '1000' }],
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
            thresholds: [{ code: 'first', recurring: false, value: '12.99' }],
          }),
          'alert-1',
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([{ code: 'first', recurring: false, value: '12' }])
      })
    })
  })
})
