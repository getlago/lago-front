import { GetWalletForTopUpQuery } from '~/generated/graphql'
import { TWalletTopUpDataForm } from '~/pages/wallet/topUp/types'

import { emptyTopUpFormDefaultValues, mapFromApiToForm } from '../mapFromApiToForm'
import { mapFormToCreateInput } from '../mapFromFormToApi'

const wallet = {
  id: 'wallet_1',
  name: 'Main wallet',
  currency: 'EUR',
  rateAmount: '2',
  invoiceRequiresSuccessfulPayment: true,
  paidTopUpMinAmountCents: '1000',
  paidTopUpMaxAmountCents: '10000',
  priority: 10,
} as unknown as GetWalletForTopUpQuery['wallet']

const baseForm = (overrides: Partial<TWalletTopUpDataForm> = {}): TWalletTopUpDataForm => ({
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: false,
  paidCredits: '10',
  name: undefined,
  metadata: undefined,
  ignorePaidTopUpLimits: undefined,
  priority: 50,
  ...overrides,
})

describe('mapFromApiToForm', () => {
  describe('GIVEN the wallet has not resolved yet', () => {
    describe('WHEN building the default values', () => {
      it('THEN should build empty defaults', () => {
        expect(mapFromApiToForm({ wallet: undefined })).toEqual({
          grantedCredits: '',
          invoiceRequiresSuccessfulPayment: undefined,
          paidCredits: '',
          name: undefined,
          metadata: undefined,
          ignorePaidTopUpLimits: undefined,
          priority: 50,
        })
      })

      it('THEN should expose the same defaults through emptyTopUpFormDefaultValues', () => {
        expect(emptyTopUpFormDefaultValues()).toEqual(mapFromApiToForm({ wallet: undefined }))
      })
    })
  })

  describe('GIVEN a resolved wallet', () => {
    describe('WHEN building the default values', () => {
      it('THEN should seed invoiceRequiresSuccessfulPayment from the wallet', () => {
        expect(mapFromApiToForm({ wallet }).invoiceRequiresSuccessfulPayment).toBe(true)
      })
    })
  })
})

describe('mapFormToCreateInput', () => {
  describe('GIVEN a filled form', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should inject the walletId and stringify the credits', () => {
        const input = mapFormToCreateInput(baseForm({ grantedCredits: '5' }), {
          walletId: 'wallet_1',
        })

        expect(input.walletId).toBe('wallet_1')
        expect(input.paidCredits).toBe('10')
        expect(input.grantedCredits).toBe('5')
        expect(input.priority).toBe(50)
      })

      it('THEN should pass name, metadata and payment settings through', () => {
        const metadata = [{ key: 'a', value: 'b' }]
        const input = mapFormToCreateInput(
          baseForm({
            name: 'My top-up',
            metadata,
            paymentMethod: { paymentMethodId: 'pm_1' },
            ignorePaidTopUpLimits: true,
          }),
          { walletId: 'wallet_1' },
        )

        expect(input.name).toBe('My top-up')
        expect(input.metadata).toBe(metadata)
        expect(input.paymentMethod).toEqual({ paymentMethodId: 'pm_1' })
        expect(input.ignorePaidTopUpLimits).toBe(true)
      })
    })
  })

  describe('GIVEN emptied credit amounts', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should send "0" for both', () => {
        const input = mapFormToCreateInput(baseForm({ paidCredits: '', grantedCredits: '' }), {
          walletId: 'wallet_1',
        })

        expect(input.paidCredits).toBe('0')
        expect(input.grantedCredits).toBe('0')
      })
    })
  })

  describe('GIVEN a missing priority', () => {
    describe('WHEN mapping to the create input', () => {
      it.each([
        ['emptied to ""', '' as unknown as number],
        ['zero', 0],
        ['undefined', undefined as unknown as number],
      ])('THEN should fall back to the default 50 (%s)', (_, priority) => {
        expect(mapFormToCreateInput(baseForm({ priority }), { walletId: 'w' }).priority).toBe(50)
      })

      it('THEN should keep an explicit priority', () => {
        expect(mapFormToCreateInput(baseForm({ priority: 7 }), { walletId: 'w' }).priority).toBe(7)
      })
    })
  })

  describe('GIVEN the invoice custom section', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should convert it to the id-only reference input', () => {
        const input = mapFormToCreateInput(
          baseForm({
            invoiceCustomSection: {
              invoiceCustomSections: [{ id: 'ics_1', name: 'Footer A' }],
              skipInvoiceCustomSections: false,
            } as unknown as TWalletTopUpDataForm['invoiceCustomSection'],
          }),
          { walletId: 'w' },
        )

        expect(input.invoiceCustomSection).toEqual({
          invoiceCustomSectionIds: ['ics_1'],
          skipInvoiceCustomSections: false,
        })
      })

      it('THEN should keep an unset section undefined', () => {
        expect(
          mapFormToCreateInput(baseForm(), { walletId: 'w' }).invoiceCustomSection,
        ).toBeUndefined()
      })
    })
  })
})
