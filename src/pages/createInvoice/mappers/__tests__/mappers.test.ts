import { InvoiceFormInput, LocalFeeInput } from '~/components/invoices/types'
import { serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetBillingEntityQuery,
  GetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'

import { emptyInvoiceFormDefaultValues, mapFromApiToForm } from '../mapFromApiToForm'
import { mapFormToCreateInput } from '../mapFromFormToApi'

const customer = {
  id: 'cus_1',
  currency: CurrencyEnum.Eur,
  billingEntity: { id: 'be_1', code: 'main' },
} as unknown as GetInfosForCreateInvoiceQuery['customer']

const customerWithoutCurrency = {
  id: 'cus_1',
  currency: null,
  billingEntity: { id: 'be_1', code: 'main' },
} as unknown as GetInfosForCreateInvoiceQuery['customer']

const billingEntity = {
  id: 'be_1',
  code: 'main',
  defaultCurrency: CurrencyEnum.Gbp,
} as unknown as GetBillingEntityQuery['billingEntity']

const baseFee = (overrides: Partial<LocalFeeInput> = {}): LocalFeeInput =>
  ({
    addOnId: 'addon_1',
    name: 'Setup fee',
    description: 'desc',
    invoiceDisplayName: '',
    units: 2,
    unitAmountCents: 12.34,
    taxes: [
      { id: 'tax_1', name: 'VAT', code: 'vat_20', rate: 20 },
      { id: 'tax_2', name: 'Eco', code: 'eco_5', rate: 5 },
    ],
    fromDatetime: '2026-07-15T00:00:00.000+02:00',
    toDatetime: '2026-07-15T23:59:59.999+02:00',
    ...overrides,
  }) as LocalFeeInput

const baseForm = (overrides: Partial<InvoiceFormInput> = {}): InvoiceFormInput => ({
  customerId: 'cus_1',
  billingEntityId: 'be_1',
  currency: CurrencyEnum.Eur,
  fees: [baseFee()],
  paymentMethod: undefined,
  invoiceCustomSection: undefined,
  purchaseOrderNumber: undefined,
  ...overrides,
})

describe('mapFromApiToForm', () => {
  describe('GIVEN no async source has resolved yet', () => {
    describe('WHEN building the default values', () => {
      it('THEN should build empty creation defaults', () => {
        const values = mapFromApiToForm({
          customerId: undefined,
          customer: undefined,
          billingEntity: undefined,
          prefillInvoice: undefined,
          prefillFees: undefined,
        })

        expect(values).toEqual({
          customerId: '',
          billingEntityId: undefined,
          currency: CurrencyEnum.Usd,
          fees: [],
          paymentMethod: undefined,
          invoiceCustomSection: undefined,
          purchaseOrderNumber: undefined,
        })
      })

      it('THEN should expose the same defaults through emptyInvoiceFormDefaultValues', () => {
        expect(emptyInvoiceFormDefaultValues()).toEqual(
          mapFromApiToForm({
            customerId: undefined,
            customer: undefined,
            billingEntity: undefined,
            prefillInvoice: undefined,
            prefillFees: undefined,
          }),
        )
      })
    })
  })

  describe('GIVEN a customer with a currency', () => {
    describe('WHEN building the default values', () => {
      it('THEN should resolve the currency from the customer first', () => {
        const values = mapFromApiToForm({
          customerId: 'cus_1',
          customer,
          billingEntity,
          prefillInvoice: undefined,
          prefillFees: undefined,
        })

        expect(values.currency).toBe(CurrencyEnum.Eur)
      })

      it('THEN should take billingEntityId from the customer billing entity', () => {
        const values = mapFromApiToForm({
          customerId: 'cus_1',
          customer,
          billingEntity: undefined,
          prefillInvoice: undefined,
          prefillFees: undefined,
        })

        expect(values.billingEntityId).toBe('be_1')
      })
    })
  })

  describe('GIVEN a customer without a currency', () => {
    describe('WHEN building the default values', () => {
      it('THEN should fall back to the billing entity defaultCurrency', () => {
        const values = mapFromApiToForm({
          customerId: 'cus_1',
          customer: customerWithoutCurrency,
          billingEntity,
          prefillInvoice: undefined,
          prefillFees: undefined,
        })

        expect(values.currency).toBe(CurrencyEnum.Gbp)
      })
    })
  })

  describe('GIVEN a voided-invoice regeneration prefill', () => {
    describe('WHEN building the default values', () => {
      it('THEN should pass the prefilled fees and purchase order number through', () => {
        const prefillFees = [baseFee()]
        const values = mapFromApiToForm({
          customerId: 'cus_1',
          customer,
          billingEntity: undefined,
          prefillInvoice: { purchaseOrderNumber: 'PO-42' },
          prefillFees,
        })

        expect(values.fees).toBe(prefillFees)
        expect(values.purchaseOrderNumber).toBe('PO-42')
      })

      it('THEN should map an empty prefill purchase order number to undefined', () => {
        const values = mapFromApiToForm({
          customerId: 'cus_1',
          customer,
          billingEntity: undefined,
          prefillInvoice: { purchaseOrderNumber: '' },
          prefillFees: undefined,
        })

        expect(values.purchaseOrderNumber).toBeUndefined()
      })
    })
  })
})

describe('mapFormToCreateInput', () => {
  describe('GIVEN a filled form without a tax provider', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should serialize amounts, convert taxes to codes and strip the local taxes key', () => {
        const input = mapFormToCreateInput(baseForm(), { hasTaxProvider: false })

        expect(input.customerId).toBe('cus_1')
        expect(input.billingEntityId).toBe('be_1')
        expect(input.currency).toBe(CurrencyEnum.Eur)
        expect(input.fees).toHaveLength(1)
        expect(input.fees[0].unitAmountCents).toBe(serializeAmount(12.34, CurrencyEnum.Eur))
        expect(input.fees[0].taxCodes).toEqual(['vat_20', 'eco_5'])
        expect(input.fees[0]).not.toHaveProperty('taxes')
        expect(input.fees[0].units).toBe(2)
      })

      it('THEN should send empty taxCodes for a fee without taxes', () => {
        const input = mapFormToCreateInput(baseForm({ fees: [baseFee({ taxes: undefined })] }), {
          hasTaxProvider: false,
        })

        expect(input.fees[0].taxCodes).toEqual([])
      })
    })
  })

  describe('GIVEN a customer with a tax provider', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should send empty taxCodes even when the fee has taxes', () => {
        const input = mapFormToCreateInput(baseForm(), { hasTaxProvider: true })

        expect(input.fees[0].taxCodes).toEqual([])
      })
    })
  })

  describe('GIVEN a fee with a missing unitAmountCents', () => {
    describe('WHEN mapping to the create input', () => {
      it.each([
        ['emptied to ""', ''],
        ['undefined', undefined],
      ])('THEN should serialize it to 0 (%s)', (_, unitAmountCents) => {
        const input = mapFormToCreateInput(baseForm({ fees: [baseFee({ unitAmountCents })] }), {
          hasTaxProvider: false,
        })

        expect(input.fees[0].unitAmountCents).toBe(0)
      })
    })
  })

  describe('GIVEN a purchase order number', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should trim it', () => {
        expect(
          mapFormToCreateInput(baseForm({ purchaseOrderNumber: '  PO-1  ' }), {
            hasTaxProvider: false,
          }).purchaseOrderNumber,
        ).toBe('PO-1')
      })

      it.each([
        ['undefined', undefined],
        ['blank', '   '],
      ])('THEN should normalize a missing value to null (%s)', (_, purchaseOrderNumber) => {
        expect(
          mapFormToCreateInput(baseForm({ purchaseOrderNumber }), { hasTaxProvider: false })
            .purchaseOrderNumber,
        ).toBeNull()
      })
    })
  })

  describe('GIVEN the voided-invoice regenerate flow', () => {
    describe('WHEN mapping without a prefill invoice id', () => {
      it('THEN should not include voidedInvoiceId', () => {
        expect(mapFormToCreateInput(baseForm(), { hasTaxProvider: false })).not.toHaveProperty(
          'voidedInvoiceId',
        )
      })
    })

    describe('WHEN mapping with a prefill invoice id', () => {
      it('THEN should link the voided invoice', () => {
        expect(
          mapFormToCreateInput(baseForm(), { hasTaxProvider: false, prefillInvoiceId: 'inv_1' })
            .voidedInvoiceId,
        ).toBe('inv_1')
      })
    })
  })

  describe('GIVEN payment method and invoice custom section values', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should convert invoiceCustomSection to the id-only reference input', () => {
        const input = mapFormToCreateInput(
          baseForm({
            invoiceCustomSection: {
              invoiceCustomSections: [
                { id: 'ics_1', name: 'Footer A' },
                { id: 'ics_2', name: 'Footer B' },
              ],
              skipInvoiceCustomSections: false,
            },
          }),
          { hasTaxProvider: false },
        )

        expect(input.invoiceCustomSection).toEqual({
          invoiceCustomSectionIds: ['ics_1', 'ics_2'],
          skipInvoiceCustomSections: false,
        })
      })

      it('THEN should keep an unset invoiceCustomSection undefined and pass paymentMethod through', () => {
        const input = mapFormToCreateInput(
          baseForm({ paymentMethod: { paymentMethodId: 'pm_1' } }),
          {
            hasTaxProvider: false,
          },
        )

        expect(input.invoiceCustomSection).toBeUndefined()
        expect(input.paymentMethod).toEqual({ paymentMethodId: 'pm_1' })
      })
    })
  })

  describe('GIVEN a form without a currency', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should serialize with the USD fallback and keep currency undefined', () => {
        const input = mapFormToCreateInput(baseForm({ currency: undefined }), {
          hasTaxProvider: false,
        })

        expect(input.fees[0].unitAmountCents).toBe(serializeAmount(12.34, CurrencyEnum.Usd))
        expect(input.currency).toBeUndefined()
      })
    })
  })
})

describe('currency precision (non-2-decimal currencies)', () => {
  describe('GIVEN a 0-decimal currency (JPY)', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should serialize amounts without multiplying', () => {
        const input = mapFormToCreateInput(
          baseForm({ currency: CurrencyEnum.Jpy, fees: [baseFee({ unitAmountCents: 500 })] }),
          { hasTaxProvider: false },
        )

        expect(input.fees[0].unitAmountCents).toBe(500)
      })
    })
  })

  describe('GIVEN a 3-decimal currency (BHD)', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should serialize amounts with a 1000 factor', () => {
        const input = mapFormToCreateInput(
          baseForm({ currency: CurrencyEnum.Bhd, fees: [baseFee({ unitAmountCents: 12.345 })] }),
          { hasTaxProvider: false },
        )

        expect(input.fees[0].unitAmountCents).toBe(12345)
      })
    })
  })

  describe('GIVEN a 2-decimal currency with a string amount (the AmountInput onChange type)', () => {
    describe('WHEN mapping to the create input', () => {
      it('THEN should serialize with a 100 factor', () => {
        const input = mapFormToCreateInput(
          baseForm({ fees: [baseFee({ unitAmountCents: '12.34' })] }),
          {
            hasTaxProvider: false,
          },
        )

        expect(input.fees[0].unitAmountCents).toBe(1234)
      })
    })
  })
})
