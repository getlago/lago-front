import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'

import {
  CurrencyEnum,
  FeeForInvoiceProductCatalogSectionFragment,
  FeeTypesEnum,
  InvoiceProductCatalogSectionFragment,
  ProductTypeEnum,
  RateCardRateModelEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID,
  INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID,
  INVOICE_PRODUCT_CATALOG_FEES_TABLE_TEST_ID,
  INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID,
  InvoiceProductCatalogFeesTable,
} from '../InvoiceProductCatalogFeesTable'

type Fee = FeeForInvoiceProductCatalogSectionFragment

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, string | number>) =>
      data ? `${key} ${JSON.stringify(data)}` : key,
  }),
}))

const createFee = (overrides: Partial<Fee> & { id: string }): Fee => ({
  amountCents: '100000',
  amountCurrency: CurrencyEnum.Usd,
  currency: CurrencyEnum.Usd,
  preciseAmountCents: 100000,
  preciseCouponsAmountCents: 0,
  subTotalExcludingTaxesAmountCents: '100000',
  subTotalExcludingTaxesPreciseAmountCents: 100000,
  taxesAmountCents: '0',
  taxesPreciseAmountCents: 0,
  totalAmountCents: '100000',
  preciseTotalAmountCents: 100000,
  units: 2,
  preciseUnitAmount: 500,
  payInAdvance: false,
  feeType: FeeTypesEnum.Charge,
  itemCode: 'item',
  itemName: 'Item',
  itemType: 'Product',
  rateModel: RateCardRateModelEnum.Standard,
  properties: { fromDatetime: '2026-08-01T00:00:00Z', toDatetime: '2026-08-15T23:59:59Z' },
  contract: { id: 'contract-1' },
  product: { id: 'p1', code: 'p1', name: 'Standard', productType: ProductTypeEnum.Metered },
  productFilter: null,
  trueUpParentFee: null,
  appliedTaxes: [{ id: 'tax-1', taxRate: 10 }],
  amountDetails: null,
  ...overrides,
})

const section: Pick<InvoiceProductCatalogSectionFragment, 'products'> = {
  products: [
    {
      amountCents: '466050',
      feesCount: 3,
      product: {
        id: 'p1',
        code: 'p1',
        name: 'Standard',
        productType: ProductTypeEnum.Metered,
      },
      filters: [],
    },
  ],
}

const feeA = createFee({ id: 'a' })
const feeTrueUp = createFee({ id: 'a-tu', trueUpParentFee: { id: 'a' } })
const feeGraduated = createFee({
  id: 'g',
  rateModel: RateCardRateModelEnum.Graduated,
  amountDetails: {
    graduatedRanges: [
      { fromValue: 0, toValue: null, units: '2', perUnitAmount: '1', perUnitTotalAmount: '2' },
    ],
  },
})

type Props = ComponentProps<typeof InvoiceProductCatalogFeesTable>

const renderTable = (props: Partial<Props> = {}): Props => {
  const allProps: Props = {
    fees: [feeA, feeTrueUp, feeGraduated],
    section,
    currency: CurrencyEnum.Usd,
    isLoading: false,
    hasError: false,
    hasActiveSearchOrFilters: false,
    onRetry: jest.fn(),
    onFeeClick: jest.fn(),
    ...props,
  }

  render(<InvoiceProductCatalogFeesTable {...allProps} />)

  return allProps
}

const getBodyRows = (): HTMLElement[] =>
  within(screen.getAllByRole('rowgroup')[1]).queryAllByRole('row')

const getCells = (testId: string): string[] =>
  within(screen.getByTestId(testId))
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '')

describe('InvoiceProductCatalogFeesTable', () => {
  describe('GIVEN a page of fees', () => {
    describe('WHEN the table renders', () => {
      it('THEN renders the product group, fee, true-up and breakdown rows', () => {
        renderTable()

        expect(screen.getByTestId(INVOICE_PRODUCT_CATALOG_FEES_TABLE_TEST_ID)).toBeInTheDocument()
        expect(
          screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID}-product-p1`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a-tu`),
        ).toBeInTheDocument()
        expect(
          screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID}-g-detail-0`),
        ).toBeInTheDocument()
        expect(getBodyRows()).toHaveLength(5)
      })

      it('THEN shows the skeleton total on the group row and leaves its value cells empty', () => {
        renderTable()

        const [, quantity, unitPrice, taxes, amount] = getCells(
          `${INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID}-product-p1`,
        )

        expect([quantity, unitPrice, taxes]).toEqual(['', '', ''])
        expect(amount).toBe('$4,660.50')
      })

      it('THEN shows quantity, unit price, taxes and amount on a fee without breakdown', () => {
        renderTable()

        const [, quantity, unitPrice, taxes, amount] = getCells(
          `${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a`,
        )

        expect(quantity).toBe('2')
        expect(unitPrice).toBe('$500')
        expect(taxes).toBe('10.00%')
        expect(amount).toBe('$1,000.00')
      })

      it('THEN leaves the value cells empty on a fee with breakdown rows', () => {
        renderTable()

        const [, ...values] = getCells(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-g`)

        expect(values).toEqual(['', '', '', ''])
      })

      it('THEN formats the fee period in the customer timezone', () => {
        renderTable({ customerTimezone: TimezoneEnum.TzAmericaLosAngeles })

        const [description] = getCells(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a`)

        expect(description).toContain('Jul 31, 2026')
        expect(description).not.toContain('Aug 1, 2026')
        expect(description).toContain('Aug 15, 2026')
      })

      it('THEN shows the breakdown values with the fee taxes', () => {
        renderTable()

        const [, quantity, unitPrice, taxes, amount] = getCells(
          `${INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID}-g-detail-0`,
        )

        expect([quantity, unitPrice, taxes, amount]).toEqual(['2', '$1', '10.00%', '$2.00'])
      })
    })

    describe('WHEN the tax provider failed', () => {
      it('THEN replaces every tax rate with a dash', () => {
        renderTable({ hasTaxProviderError: true })

        const [, , , feeTaxes] = getCells(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a`)
        const [, , , detailTaxes] = getCells(
          `${INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID}-g-detail-0`,
        )

        expect([feeTaxes, detailTaxes]).toEqual(['-', '-'])
      })
    })
  })

  describe('GIVEN an onFeeClick handler', () => {
    describe('WHEN a fee row is clicked', () => {
      it.each([
        ['fee', 'a', feeA],
        ['true-up', 'a-tu', feeTrueUp],
      ])('THEN opens the %s', async (_, id, fee) => {
        const user = userEvent.setup()
        const { onFeeClick } = renderTable()

        await user.click(screen.getByTestId(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-${id}`))

        expect(onFeeClick).toHaveBeenCalledTimes(1)
        expect(onFeeClick).toHaveBeenCalledWith(fee)
      })
    })

    describe('WHEN a group or breakdown row is clicked', () => {
      it.each([
        ['group', `${INVOICE_PRODUCT_CATALOG_GROUP_ROW_TEST_ID}-product-p1`],
        ['breakdown', `${INVOICE_PRODUCT_CATALOG_DETAIL_ROW_TEST_ID}-g-detail-0`],
      ])('THEN does not open anything for a %s row', async (_, testId) => {
        const user = userEvent.setup()
        const { onFeeClick } = renderTable()

        await user.click(screen.getByTestId(testId))

        expect(onFeeClick).not.toHaveBeenCalled()
        expect(screen.getByTestId(testId)).not.toHaveClass('cursor-pointer')
      })
    })
  })

  describe('GIVEN the fees are loading', () => {
    describe('WHEN the table renders', () => {
      it('THEN renders ten skeleton rows and no data rows', () => {
        renderTable({ isLoading: true })

        expect(getBodyRows()).toHaveLength(10)
        expect(
          screen.queryByTestId(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a`),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the fees query failed', () => {
    describe('WHEN the retry button is clicked', () => {
      it('THEN calls onRetry and renders no data rows', async () => {
        const user = userEvent.setup()
        const { onRetry } = renderTable({ hasError: true })

        expect(
          screen.queryByTestId(`${INVOICE_PRODUCT_CATALOG_FEE_ROW_TEST_ID}-a`),
        ).not.toBeInTheDocument()

        await user.click(within(getBodyRows()[0]).getByRole('button'))

        expect(onRetry).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN no fees', () => {
    describe.each([
      ['with', true],
      ['without', false],
    ])('WHEN rendered %s an active search or filter', (_, hasActiveSearchOrFilters) => {
      it('THEN renders the empty placeholder', () => {
        renderTable({ fees: [], hasActiveSearchOrFilters })

        expect(getBodyRows()).toHaveLength(1)
        expect(within(getBodyRows()[0]).getAllByRole('cell')).toHaveLength(1)
      })
    })

    describe('WHEN a search or filter is active', () => {
      it('THEN uses a different placeholder copy than the unfiltered empty state', () => {
        renderTable({ fees: [], hasActiveSearchOrFilters: true })
        const filtered = getBodyRows()[0].textContent

        document.body.innerHTML = ''
        renderTable({ fees: [], hasActiveSearchOrFilters: false })

        expect(getBodyRows()[0].textContent).not.toBe(filtered)
      })
    })
  })
})
