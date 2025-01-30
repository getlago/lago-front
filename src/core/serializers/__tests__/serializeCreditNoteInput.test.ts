import { CreditTypeEnum } from '~/components/creditNote/types'
import { serializeCreditNoteInput } from '~/core/serializers/serializeCreditNoteInput'
import { CreditNoteReasonEnum, CurrencyEnum } from '~/generated/graphql'

describe('serializeCreditNoteInput()', () => {
  describe('a simple credit note one', () => {
    it('returns serialized credit notes input', () => {
      const plan = serializeCreditNoteInput(
        '993589e0-e8ff-46a4-a471-36618225d8e6',
        {
          creditAmount: 0.74,
          amountCurrency: CurrencyEnum.Eur,
          refundAmount: 0,
          reason: CreditNoteReasonEnum.Other,
          fees: {
            '5db47206-183b-4b2b-9ce2-f8399448c2c2': {
              subscriptionName: 'Group Plan',
              fees: {
                '0_d185efb0-dd54-4676-84ae-8feb9e5d58b6': {
                  id: 'd185efb0-dd54-4676-84ae-8feb9e5d58b6',
                  checked: true,
                  value: 0.74,
                  name: 'Group Plan',
                  maxAmount: 74,
                  appliedTaxes: [
                    {
                      id: '1234',
                      taxName: 'VAT',
                      taxRate: 0.2,
                    },
                  ],
                },
              },
            },
          },
          payBack: [
            {
              value: 0.74,
              type: CreditTypeEnum.credit,
            },
          ],
        },
        CurrencyEnum.Eur,
      )

      expect(plan).toStrictEqual({
        invoiceId: '993589e0-e8ff-46a4-a471-36618225d8e6',
        reason: 'other',
        creditAmountCents: 74,
        description: undefined,
        refundAmountCents: 0,
        items: [
          {
            feeId: 'd185efb0-dd54-4676-84ae-8feb9e5d58b6',
            amountCents: 74,
          },
        ],
      })
    })
  })

  describe('a credit note with multiple grouped fees', () => {
    it('returns serialized credit notes input', () => {
      const plan = serializeCreditNoteInput(
        '993589e0-e8ff-46a4-a471-36618225d8e6',
        {
          creditAmount: 90674,
          amountCurrency: CurrencyEnum.Eur,
          refundAmount: 0,
          reason: CreditNoteReasonEnum.Other,
          fees: {
            '5db47206-183b-4b2b-9ce2-f8399448c2c2': {
              subscriptionName: 'Group Plan',
              fees: {
                '0_d185efb0-dd54-4676-84ae-8feb9e5d58b6': {
                  id: 'd185efb0-dd54-4676-84ae-8feb9e5d58b6',
                  checked: true,
                  value: 0.74,
                  name: 'Group Plan',
                  maxAmount: 74,
                  appliedTaxes: [
                    {
                      id: '1234',
                      taxName: 'VAT',
                      taxRate: 0.2,
                    },
                  ],
                },
                '309591d6-041d-4aa6-a5c2-6189c49e277b': {
                  name: 'Count BM - One dimension',
                  grouped: {
                    '42b948dc-cd51-4951-bc7e-8a25414e994f': {
                      id: '42b948dc-cd51-4951-bc7e-8a25414e994f',
                      checked: true,
                      value: 274,
                      name: 'france',
                      maxAmount: 27400,
                      appliedTaxes: [
                        {
                          id: '1234',
                          taxName: 'VAT',
                          taxRate: 0.2,
                        },
                      ],
                    },
                    '3aa1eca1-4a22-4b61-ae65-7f16ee06a670': {
                      id: '3aa1eca1-4a22-4b61-ae65-7f16ee06a670',
                      checked: true,
                      value: 345,
                      name: 'italy',
                      maxAmount: 34500,
                      appliedTaxes: [
                        {
                          id: '1234',
                          taxName: 'VAT',
                          taxRate: 0.2,
                        },
                      ],
                    },
                  },
                },
                '6eb177a8-e30b-46c4-b426-ce7967c3d8d6': {
                  name: 'Count BM - Two dimensions',
                  grouped: {
                    '87b3d55f-16aa-48e7-ba73-8cbac8520d77': {
                      id: '87b3d55f-16aa-48e7-ba73-8cbac8520d77',
                      checked: false,
                      value: 0,
                      name: 'AWS • usa',
                      maxAmount: 0,
                      appliedTaxes: [
                        {
                          id: '1234',
                          taxName: 'VAT',
                          taxRate: 0.2,
                        },
                      ],
                    },
                    '7097d3cd-71e9-488a-8d84-6d87e94f120e': {
                      id: '7097d3cd-71e9-488a-8d84-6d87e94f120e',
                      checked: true,
                      value: 124,
                      name: 'AWS • europe',
                      maxAmount: 12400,
                      appliedTaxes: [
                        {
                          id: '1234',
                          taxName: 'VAT',
                          taxRate: 0.2,
                        },
                      ],
                    },
                    'eb7332f7-146c-4b7f-82aa-ba6f74c06d29': {
                      id: 'eb7332f7-146c-4b7f-82aa-ba6f74c06d29',
                      checked: true,
                      value: 163,
                      name: 'Google • usa',
                      maxAmount: 16300,
                      appliedTaxes: [
                        {
                          id: '1234',
                          taxName: 'VAT',
                          taxRate: 0.2,
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          payBack: [
            {
              value: 906.74,
              type: CreditTypeEnum.credit,
            },
          ],
        },
        CurrencyEnum.Eur,
      )

      expect(plan).toStrictEqual({
        invoiceId: '993589e0-e8ff-46a4-a471-36618225d8e6',
        reason: 'other',
        creditAmountCents: 90674,
        description: undefined,
        refundAmountCents: 0,
        items: [
          {
            feeId: 'd185efb0-dd54-4676-84ae-8feb9e5d58b6',
            amountCents: 74,
          },
          {
            feeId: '42b948dc-cd51-4951-bc7e-8a25414e994f',
            amountCents: 27400,
          },
          {
            feeId: '3aa1eca1-4a22-4b61-ae65-7f16ee06a670',
            amountCents: 34500,
          },
          {
            feeId: '7097d3cd-71e9-488a-8d84-6d87e94f120e',
            amountCents: 12400,
          },
          {
            feeId: 'eb7332f7-146c-4b7f-82aa-ba6f74c06d29',
            amountCents: 16300,
          },
        ],
      })
    })
  })
})
