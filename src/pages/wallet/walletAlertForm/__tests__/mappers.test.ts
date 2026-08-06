import { AlertTypeEnum, CurrencyEnum, GetWalletAlertToEditQuery } from '~/generated/graphql'
import {
  mapFormToCreateInput,
  mapFormToUpdateInput,
  mapFromApiToForm,
} from '~/pages/wallet/walletAlertForm/mappers'
import { TValidatedWalletAlertForm } from '~/pages/wallet/walletAlertForm/validationSchema'

type ExistingAlert = NonNullable<GetWalletAlertToEditQuery['walletAlert']>

const existingAlert = (overrides: Partial<ExistingAlert> = {}): ExistingAlert => ({
  __typename: 'Alert',
  id: 'alert-1',
  walletId: 'wallet-1',
  alertType: AlertTypeEnum.WalletBalanceAmount,
  code: 'my-alert',
  name: 'My alert',
  thresholds: [{ __typename: 'AlertThreshold', code: 'first', recurring: false, value: '1000' }],
  ...overrides,
})

const formValues = (
  overrides: Partial<TValidatedWalletAlertForm> = {},
): TValidatedWalletAlertForm => ({
  walletId: 'wallet-1',
  name: 'My alert',
  code: 'my-alert',
  alertType: AlertTypeEnum.WalletBalanceAmount,
  thresholds: [{ code: 'first', recurring: false, value: '10' }],
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
            walletId: 'wallet-1',
            currency: CurrencyEnum.Usd,
            alert: existingAlert(),
          }),
        ).toEqual({
          walletId: 'wallet-1',
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.WalletBalanceAmount,
          thresholds: [{ code: 'first', recurring: false, value: '10' }],
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
      it('THEN should serialize the thresholds to cents', () => {
        expect(mapFormToCreateInput(formValues(), CurrencyEnum.Usd)).toEqual({
          walletId: 'wallet-1',
          name: 'My alert',
          code: 'my-alert',
          alertType: AlertTypeEnum.WalletBalanceAmount,
          thresholds: [{ code: 'first', recurring: false, value: '1000' }],
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
            thresholds: [{ code: 'first', recurring: false, value: '12.99' }],
          }),
          CurrencyEnum.Usd,
        )

        expect(thresholds).toEqual([{ code: 'first', recurring: false, value: '12' }])
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
      it('THEN should carry the id and omit the immutable alertType and walletId', () => {
        expect(mapFormToUpdateInput(formValues(), 'alert-1', CurrencyEnum.Usd)).toEqual({
          id: 'alert-1',
          name: 'My alert',
          code: 'my-alert',
          thresholds: [{ code: 'first', recurring: false, value: '1000' }],
        })
      })

      it('THEN should still use the alert type to serialize the thresholds', () => {
        const { thresholds } = mapFormToUpdateInput(
          formValues({
            alertType: AlertTypeEnum.WalletCreditsBalance,
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
