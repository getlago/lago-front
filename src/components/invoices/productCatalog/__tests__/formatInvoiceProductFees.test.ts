import {
  CurrencyEnum,
  FeeForInvoiceProductCatalogFeesTableFragment,
  InvoiceProductCatalogSectionFragment,
  ProductTypeEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'

import { formatInvoiceProductFees, InvoiceProductCatalogFeeRow } from '../formatInvoiceProductFees'

type Fee = FeeForInvoiceProductCatalogFeesTableFragment
type Row = InvoiceProductCatalogFeeRow<Fee>

const createFee = (overrides: Partial<Fee> & { id: string }): Fee => ({
  amountCents: '1000',
  units: 1,
  preciseUnitAmount: 10,
  rateModel: RateCardRateModelEnum.Standard,
  properties: { fromDatetime: '2026-08-01T00:00:00Z', toDatetime: '2026-08-15T23:59:59Z' },
  contract: { id: 'contract-1' },
  product: { id: 'p1', name: 'Standard' },
  productFilter: null,
  trueUpParentFee: null,
  appliedTaxes: [{ id: 'tax-1', taxRate: 20 }],
  amountDetails: null,
  ...overrides,
})

const createProductGroup = (
  id: string,
  amountCents: string,
  filters: Array<{ id: string; amountCents: string }> = [],
): InvoiceProductCatalogSectionFragment['products'][number] => ({
  amountCents,
  feesCount: 1,
  product: {
    id,
    code: id,
    name: `Product ${id}`,
    invoiceDisplayName: `Display ${id}`,
    productType: ProductTypeEnum.Metered,
  },
  filters: filters.map((filter) => ({
    amountCents: filter.amountCents,
    feesCount: 1,
    productFilter: { id: filter.id, code: filter.id, name: `Filter ${filter.id}` },
  })),
})

const section = {
  products: [
    createProductGroup('p1', '466050', [{ id: 'f1', amountCents: '200000' }]),
    createProductGroup('p2', '100000'),
  ],
}

const format = (fees: Fee[]): Row[] =>
  formatInvoiceProductFees({ fees, section, currency: CurrencyEnum.Usd })

const getFeeRow = (rows: Row[]): Extract<Row, { kind: 'fee' }> => {
  const [product] = rows

  if (product.kind !== 'product') throw new Error('expected a product row')

  const [fee] = product.subRows

  if (fee.kind !== 'fee') throw new Error('expected a fee row')

  return fee
}

const getDetailRows = (fee: Fee): Array<Extract<Row, { kind: 'detail' }>> =>
  getFeeRow(format([fee])).subRows.filter(
    (row): row is Extract<Row, { kind: 'detail' }> => row.kind === 'detail',
  )

const filterFee = { id: 'f1', name: 'Filter f1' }

describe('formatInvoiceProductFees', () => {
  describe('GIVEN a first page of fees for one product', () => {
    describe('WHEN fees include a true-up and a filtered fee', () => {
      it('THEN groups them under one product row with skeleton totals', () => {
        const rows = format([
          createFee({ id: 'a' }),
          createFee({ id: 'a-tu', trueUpParentFee: { id: 'a' } }),
          createFee({ id: 'b', productFilter: filterFee }),
        ])

        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          kind: 'product',
          id: 'product-p1',
          label: 'Display p1',
          amountCents: '466050',
          subRows: [
            { kind: 'fee', id: 'a', isTrueUp: false },
            { kind: 'fee', id: 'a-tu', isTrueUp: true },
            {
              kind: 'filter',
              id: 'filter-f1',
              label: 'Filter f1',
              amountCents: '200000',
              subRows: [{ kind: 'fee', id: 'b' }],
            },
          ],
        })
      })
    })
  })

  describe('GIVEN a second page continuing a group from the previous page', () => {
    describe('WHEN the page starts inside a filter and then moves to another product', () => {
      it('THEN repeats the product and filter headers with skeleton totals, not page sums', () => {
        const rows = format([
          createFee({
            id: 'b-tu',
            amountCents: '5',
            productFilter: filterFee,
            trueUpParentFee: { id: 'b' },
          }),
          createFee({ id: 'c', product: { id: 'p2', name: 'Graduated' } }),
        ])

        expect(rows).toMatchObject([
          {
            kind: 'product',
            id: 'product-p1',
            amountCents: '466050',
            subRows: [{ kind: 'filter', id: 'filter-f1', subRows: [{ id: 'b-tu' }] }],
          },
          { kind: 'product', id: 'product-p2', amountCents: '100000', subRows: [{ id: 'c' }] },
        ])
      })
    })
  })

  describe('GIVEN a fee whose product and filter are missing from the skeleton', () => {
    describe('WHEN it is formatted', () => {
      it('THEN still renders it under groups labelled from the fee with a zero total', () => {
        const rows = format([
          createFee({
            id: 'orphan',
            product: { id: 'p9', name: 'Orphan', invoiceDisplayName: 'Orphan display' },
            productFilter: { id: 'f9', name: 'Orphan filter' },
          }),
        ])

        expect(rows).toMatchObject([
          {
            kind: 'product',
            label: 'Orphan display',
            amountCents: '0',
            subRows: [
              {
                kind: 'filter',
                label: 'Orphan filter',
                amountCents: '0',
                subRows: [{ id: 'orphan' }],
              },
            ],
          },
        ])
      })
    })
  })

  describe('GIVEN fees of different contracts on the same product', () => {
    describe('WHEN they follow each other', () => {
      it('THEN starts a new product group per contract with a unique row id each', () => {
        const rows = format([
          createFee({ id: 'x' }),
          createFee({ id: 'y', contract: { id: 'contract-2' } }),
        ])

        expect(rows.map(({ id }) => id)).toEqual(['product-p1', 'product-p1-1'])
      })
    })
  })

  describe('GIVEN a filter group interrupted by an unfiltered fee of the same product', () => {
    describe('WHEN the filter group resumes', () => {
      it('THEN gives the repeated filter group a unique row id', () => {
        const [product] = format([
          createFee({ id: 'b', productFilter: filterFee }),
          createFee({ id: 'a' }),
          createFee({ id: 'c', productFilter: filterFee }),
        ])

        if (product.kind !== 'product') throw new Error('expected a product row')

        expect(product.subRows.map(({ id }) => id)).toEqual(['filter-f1', 'a', 'filter-f1-1'])
      })
    })
  })

  describe('GIVEN fees without a breakdown', () => {
    describe('WHEN the rate model has no breakdown or the fee is a true-up', () => {
      it.each([
        ['standard', createFee({ id: 's', rateModel: RateCardRateModelEnum.Standard })],
        ['dynamic', createFee({ id: 'd', rateModel: RateCardRateModelEnum.Dynamic })],
        ['custom', createFee({ id: 'cu', rateModel: RateCardRateModelEnum.Custom })],
        ['without rate model', createFee({ id: 'n', rateModel: null })],
        [
          'true-up of a graduated fee',
          createFee({
            id: 't',
            rateModel: RateCardRateModelEnum.Graduated,
            trueUpParentFee: { id: 'g' },
            amountDetails: {
              graduatedRanges: [{ fromValue: 0, toValue: null, units: '1', perUnitAmount: '1' }],
            },
          }),
        ],
        [
          'volume without flat amount',
          createFee({
            id: 'v',
            rateModel: RateCardRateModelEnum.Volume,
            amountDetails: { flatUnitAmount: '0', perUnitAmount: '1', perUnitTotalAmount: '1' },
          }),
        ],
      ])('THEN a %s fee has no sub rows', (_, fee) => {
        expect(getFeeRow(format([fee])).subRows).toEqual([])
      })
    })
  })

  describe('GIVEN a graduated fee', () => {
    const fee = createFee({
      id: 'g',
      rateModel: RateCardRateModelEnum.Graduated,
      amountDetails: {
        graduatedRanges: [
          {
            fromValue: 0,
            toValue: 10,
            units: '10',
            perUnitAmount: '1',
            perUnitTotalAmount: '10',
            flatUnitAmount: '5',
          },
          {
            fromValue: 10,
            toValue: 20,
            units: '10',
            perUnitAmount: '0.8',
            perUnitTotalAmount: '8',
            flatUnitAmount: '0',
          },
          {
            fromValue: 20,
            toValue: null,
            units: '2',
            perUnitAmount: '0.5',
            perUnitTotalAmount: '1',
            flatUnitAmount: '3',
          },
        ],
      },
    })

    describe('WHEN it is formatted', () => {
      it('THEN lists one row per range then one per non-zero flat amount, with the fee taxes', () => {
        expect(getDetailRows(fee)).toMatchObject([
          { id: 'g-detail-0', quantity: 10, unitPrice: { type: 'amount', value: 1 }, amount: 10 },
          { id: 'g-detail-1', quantity: 10, unitPrice: { type: 'amount', value: 0.8 }, amount: 8 },
          { id: 'g-detail-2', quantity: 2, unitPrice: { type: 'amount', value: 0.5 }, amount: 1 },
          { id: 'g-detail-3', quantity: 1, unitPrice: { type: 'amount', value: 5 }, amount: 5 },
          { id: 'g-detail-4', quantity: 1, unitPrice: { type: 'amount', value: 3 }, amount: 3 },
        ])
        expect(getDetailRows(fee).every(({ taxRates }) => taxRates[0] === 20)).toBe(true)
      })

      it('THEN gives the first, middle and last ranges distinct labels, only bounded ones a toValue', () => {
        const [first, middle, last, firstFlat, lastFlat] = getDetailRows(fee)

        expect(new Set([first, middle, last].map(({ labelKey }) => labelKey)).size).toBe(3)
        expect(first.labelParams).toEqual({ toValue: 10 })
        expect(middle.labelParams).toEqual({ toValue: 20 })
        expect(last.labelParams).toBeUndefined()
        expect(firstFlat.labelKey).not.toBe(first.labelKey)
        expect(firstFlat.labelParams).toEqual({ toValue: 10 })
        expect(lastFlat.labelKey).not.toBe(last.labelKey)
      })
    })

    describe('WHEN it has a single range', () => {
      it('THEN labels it like the last range of a longer list', () => {
        const [, , last] = getDetailRows(fee)
        const [single] = getDetailRows(
          createFee({
            id: 'single',
            rateModel: RateCardRateModelEnum.Graduated,
            amountDetails: {
              graduatedRanges: [
                {
                  fromValue: 0,
                  toValue: null,
                  units: '4',
                  perUnitAmount: '1',
                  flatUnitAmount: '0',
                },
              ],
            },
          }),
        )

        expect(single.labelKey).toBe(last.labelKey)
        expect(single.labelParams).toBeUndefined()
      })
    })

    describe('WHEN the units stop inside a bounded tier', () => {
      const createTruncatedFee = (
        graduatedRanges: Array<{ fromValue: number; toValue: number }>,
      ): Fee =>
        createFee({
          id: 'truncated',
          rateModel: RateCardRateModelEnum.Graduated,
          amountDetails: {
            graduatedRanges: graduatedRanges.map((range) => ({
              ...range,
              units: '1',
              perUnitAmount: '1',
              perUnitTotalAmount: '1',
              flatUnitAmount: '2',
            })),
          },
        })

      it('THEN labels a lone first tier as the first tier, not the remaining units', () => {
        const [first, , , firstFlat] = getDetailRows(fee)
        const [lone, loneFlat] = getDetailRows(createTruncatedFee([{ fromValue: 0, toValue: 100 }]))

        expect(lone.labelKey).toBe(first.labelKey)
        expect(lone.labelParams).toEqual({ toValue: 100 })
        expect(loneFlat.labelKey).toBe(firstFlat.labelKey)
        expect(loneFlat.labelParams).toEqual({ toValue: 100 })
      })

      it('THEN labels a bounded last tier as a middle tier with its upper bound', () => {
        const [, middle] = getDetailRows(fee)
        const [, bounded] = getDetailRows(
          createTruncatedFee([
            { fromValue: 0, toValue: 100 },
            { fromValue: 100, toValue: 500 },
          ]),
        )

        expect(bounded.labelKey).toBe(middle.labelKey)
        expect(bounded.labelParams).toEqual({ toValue: 500 })
      })
    })
  })

  describe('GIVEN a graduated percentage fee', () => {
    describe('WHEN it is formatted', () => {
      it('THEN shows each range rate as a percent unit price and its flat amounts', () => {
        const rows = getDetailRows(
          createFee({
            id: 'gp',
            rateModel: RateCardRateModelEnum.GraduatedPercentage,
            amountDetails: {
              graduatedPercentageRanges: [
                {
                  fromValue: 0,
                  toValue: 100,
                  units: '100',
                  rate: '1',
                  perUnitTotalAmount: '1',
                  flatUnitAmount: '0.5',
                },
                {
                  fromValue: 100,
                  toValue: null,
                  units: '50',
                  rate: '0.5',
                  perUnitTotalAmount: '0.25',
                  flatUnitAmount: '0',
                },
              ],
            },
          }),
        )

        expect(rows).toMatchObject([
          { quantity: 100, unitPrice: { type: 'percent', value: 1 }, amount: 1 },
          { quantity: 50, unitPrice: { type: 'percent', value: 0.5 }, amount: 0.25 },
          { quantity: 1, unitPrice: { type: 'amount', value: 0.5 }, amount: 0.5 },
        ])
      })
    })
  })

  describe('GIVEN a volume fee with a flat amount', () => {
    describe('WHEN it is formatted', () => {
      it('THEN lists the per unit row then the flat row', () => {
        const rows = getDetailRows(
          createFee({
            id: 'v',
            units: 12,
            rateModel: RateCardRateModelEnum.Volume,
            amountDetails: { flatUnitAmount: '4', perUnitAmount: '2', perUnitTotalAmount: '24' },
          }),
        )

        expect(rows).toMatchObject([
          { quantity: 12, unitPrice: { type: 'amount', value: 2 }, amount: 24 },
          { quantity: 1, unitPrice: { type: 'amount', value: 4 }, amount: 4 },
        ])
        expect(rows[0].labelKey).not.toBe(rows[1].labelKey)
      })
    })
  })

  describe('GIVEN a package fee', () => {
    const createPackageFee = (freeUnits: string): Fee =>
      createFee({
        id: 'pk',
        amountCents: '2000',
        rateModel: RateCardRateModelEnum.Package,
        amountDetails: {
          freeUnits,
          paidUnits: '100',
          perPackageSize: 50,
          perPackageUnitAmount: '10',
        },
      })

    describe('WHEN it has free units', () => {
      it('THEN lists the free units row then the package row priced from the fee amount', () => {
        expect(getDetailRows(createPackageFee('10'))).toMatchObject([
          { labelParams: { freeUnits: 10 }, quantity: 10, amount: 0 },
          {
            quantity: 100,
            unitPrice: { type: 'package', amount: 10, size: 50 },
            amount: 20,
          },
        ])
      })
    })

    describe('WHEN it has no free units', () => {
      it('THEN lists only the package row', () => {
        expect(getDetailRows(createPackageFee('0'))).toHaveLength(1)
      })
    })
  })

  describe('GIVEN a percentage fee', () => {
    const baseDetails = {
      paidUnits: '3',
      rate: '2',
      perUnitTotalAmount: '6',
      fixedFeeUnitAmount: '0',
      fixedFeeTotalAmount: '0',
      freeUnits: '0',
      freeEvents: 0,
      paidEvents: 4,
      minMaxAdjustmentTotalAmount: '0',
    }
    const createPercentageFee = (details: Partial<typeof baseDetails>): Fee =>
      createFee({
        id: 'pc',
        rateModel: RateCardRateModelEnum.Percentage,
        amountDetails: { ...baseDetails, ...details },
      })

    describe('WHEN only the rate applies', () => {
      it('THEN lists only the rate row', () => {
        expect(getDetailRows(createPercentageFee({}))).toMatchObject([
          { quantity: 3, unitPrice: { type: 'percent', value: 2 }, amount: 6 },
        ])
      })
    })

    describe('WHEN free units, fixed fees and a min/max adjustment apply', () => {
      it('THEN lists free units, rate, fixed fee and adjustment rows in order', () => {
        const rows = getDetailRows(
          createPercentageFee({
            freeUnits: '5',
            freeEvents: 2,
            fixedFeeUnitAmount: '1',
            fixedFeeTotalAmount: '4',
            minMaxAdjustmentTotalAmount: '-50.5',
          }),
        )

        expect(rows).toMatchObject([
          { labelParams: { freeEvents: 2 }, plural: 2, quantity: 5, amount: 0 },
          { quantity: 3, unitPrice: { type: 'percent', value: 2 }, amount: 6 },
          { quantity: 4, unitPrice: { type: 'amount', value: 1 }, amount: 4 },
          { amount: -50.5 },
        ])
        expect(rows[3].quantity).toBeUndefined()
        expect(rows[3].unitPrice).toBeUndefined()
      })
    })
  })
})
