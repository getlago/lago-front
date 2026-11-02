import {
  AlertTypeEnum,
  CurrencyEnum,
  GetWalletAlertToEditQuery,
  NotifyOnEnum,
} from '~/generated/graphql'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/wallet/walletAlertForm/mappers'
import { TValidatedWalletAlertForm } from '~/pages/wallet/walletAlertForm/validationSchema'

const TRIGGERED = [NotifyOnEnum.Triggered]
const TRIGGERED_AND_RESOLVED = [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved]

type ExistingAlert = NonNullable<GetWalletAlertToEditQuery['walletAlert']>

const existingAlert = (overrides: Partial<ExistingAlert> = {}): ExistingAlert => ({
  __typename: 'Alert',
  id: 'alert-1',
  walletId: 'wallet-1',
  alertType: AlertTypeEnum.WalletBalanceAmount,
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
  overrides: Partial<TValidatedWalletAlertForm> = {},
): TValidatedWalletAlertForm => ({
  walletId: 'wallet-1',
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.WalletBalanceAmount,
  thresholds: [{ code: 'first', recurring: false, value: '10', notifyOn: TRIGGERED }],
  ...overrides,
})

describe('mapFromApiToForm', () => {
  describe('GIVEN no existing alert', () => {
    describe('WHEN building the form values', () => {
      it('THEN should return empty values with a single empty threshold', () => {
        expect(
          mapFromApiToForm({ walletId: 'wallet-1', currency: CurrencyEnum.Usd, alert: undefined }),
        ).toEqual({
          walletId: 'wallet-1',
          name: '',
          code: '',
          alertType: '',
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
            walletId: 'wallet-1',
            currency: CurrencyEnum.Usd,
            alert: existingAlert(),
          }),
        ).toEqual({
          walletId: 'wallet-1',
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.WalletBalanceAmount,
          thresholds: [{ code: 'first', recurring: false, value: '10', notifyOn: TRIGGERED }],
        })
      })

      it('THEN should drop the __typename of the edit query', () => {
        const { thresholds } = mapFromApiToForm({
          walletId: 'wallet-1',
          currency: CurrencyEnum.Usd,
          alert: existingAlert(),
        })

        expect(thresholds[0]).not.toHaveProperty('__typename')
      })
    })
  })

  describe('GIVEN an existing credits alert', () => {
    describe('WHEN building the form values', () => {
      it('THEN should truncate the threshold to units instead of deserializing it', () => {
        const { thresholds } = mapFromApiToForm({
          walletId: 'wallet-1',
          currency: CurrencyEnum.Usd,
          alert: existingAlert({
            alertType: AlertTypeEnum.WalletCreditsBalance,
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
      it('THEN should serialize the thresholds to cents', () => {
        expect(mapFormToCreateInput(formValues(), CurrencyEnum.Usd)).toEqual({
          walletId: 'wallet-1',
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.WalletBalanceAmount,
          thresholds: [{ code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED }],
        })
      })
    })
  })

  describe('GIVEN a credits alert', () => {
    describe('WHEN building the create input', () => {
      it('THEN should truncate the thresholds to integers', () => {
        const { thresholds } = mapFormToCreateInput(
          formValues({
            alertType: AlertTypeEnum.WalletCreditsBalance,
            thresholds: [{ code: 'first', recurring: false, value: '12.99', notifyOn: TRIGGERED }],
          }),
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([
          { code: 'first', recurring: false, value: '12', notifyOn: TRIGGERED },
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
      it('THEN should carry the id and omit the immutable alertType and walletId', () => {
        expect(mapFormToUpdateInput(formValues(), 'alert-1', CurrencyEnum.Usd)).toEqual({
          id: 'alert-1',
          name: 'My alert',
          code: 'my-alert',
          thresholds: [{ code: 'first', recurring: false, value: '1000', notifyOn: TRIGGERED }],
        })
      })

      it('THEN should still use the alert type to serialize the thresholds', () => {
        const { thresholds } = mapFormToUpdateInput(
          formValues({
            alertType: AlertTypeEnum.WalletCreditsBalance,
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
          walletId: 'wallet-1',
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
      it('THEN should send an explicit notifyOn without discarding values on every threshold', () => {
        const values = formValues({
          thresholds: [
            { code: 'warn', recurring: false, value: '10' },
            {
              code: 'hard',
              recurring: false,
              value: '20',
              notifyOn: [NotifyOnEnum.Resolved, NotifyOnEnum.Triggered],
            },
            {
              code: 'odd',
              recurring: false,
              value: '30',
              notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved, NotifyOnEnum.Resolved],
            },
            { code: 'every', recurring: true, value: '5', notifyOn: TRIGGERED },
          ],
        })

        expect(mapFormToCreateInput(values, CurrencyEnum.Usd).thresholds).toEqual([
          { code: 'warn', recurring: false, value: '1000', notifyOn: TRIGGERED },
          {
            code: 'hard',
            recurring: false,
            value: '2000',
            notifyOn: [NotifyOnEnum.Resolved, NotifyOnEnum.Triggered],
          },
          {
            code: 'odd',
            recurring: false,
            value: '3000',
            notifyOn: [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved, NotifyOnEnum.Resolved],
          },
          { code: 'every', recurring: true, value: '500', notifyOn: TRIGGERED },
        ])
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
          walletId: 'wallet-1',
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
            { ...formState, alertType: AlertTypeEnum.WalletBalanceAmount },
            'alert-1',
            CurrencyEnum.Usd,
          ),
        ).toEqual({
          id: 'alert-1',
          name: 'My alert',
          code: 'my-alert',
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

it('normalizes recurring resolution on load and preserves other arrays on save', () => {
  const preserved = [NotifyOnEnum.Resolved, NotifyOnEnum.Triggered, NotifyOnEnum.Triggered]
  const form = mapFromApiToForm({
    walletId: 'wallet-1',
    currency: CurrencyEnum.Usd,
    alert: existingAlert({
      thresholds: [
        { code: 'hard', recurring: false, value: '1000', notifyOn: preserved },
        { code: 'every', recurring: true, value: '500', notifyOn: TRIGGERED_AND_RESOLVED },
      ],
    }),
  })

  expect(form.thresholds[1].notifyOn).toEqual(TRIGGERED)
  const input = mapFormToUpdateInput(
    { ...form, name: 'Unrelated edit', alertType: AlertTypeEnum.WalletBalanceAmount },
    'alert-1',
    CurrencyEnum.Usd,
  )

  expect(input.thresholds?.map(({ notifyOn }) => notifyOn)).toEqual([preserved, TRIGGERED])
})
