import { render as plainRender, renderHook, screen, within } from '@testing-library/react'
import { ReactNode } from 'react'

import {
  VIEW_FEE_DETAILS_DRAWER_TEST_ID,
  VIEW_FEE_DETAILS_HEADER_TEST_ID,
  VIEW_FEE_DETAILS_OVERVIEW_TEST_ID,
  VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID,
} from '~/components/invoices/details/invoiceDetailsTestIds'
import {
  useViewFeeDetailsDrawer,
  ViewFeeDetailsDrawerProvider,
} from '~/components/invoices/details/ViewFeeDetailsDrawer'
import {
  CurrencyEnum,
  FeeForViewFeeDetailsDrawerFragment,
  FeeTypesEnum,
  PlanInterval,
  ProductTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

// Mock the underlying drawer hook so the test doesn't pull in the Vite-only
// `drawerStack` module. We capture the props passed to `drawer.open()` so we
// can render the children ourselves and assert on the body content.
const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({
    open: mockDrawerOpen,
    close: mockDrawerClose,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => jest.requireActual('../../../../../translations/base.json')[key],
  }),
}))

const buildFee = (
  overrides: Partial<FeeForViewFeeDetailsDrawerFragment> = {},
): FeeForViewFeeDetailsDrawerFragment =>
  ({
    id: 'fee-abc',
    amountCents: '100000',
    amountCurrency: CurrencyEnum.Usd,
    preciseAmountCents: 1000,
    preciseCouponsAmountCents: 0,
    subTotalExcludingTaxesAmountCents: '100000',
    subTotalExcludingTaxesPreciseAmountCents: 1000,
    taxesRate: 20,
    taxesAmountCents: '20000',
    taxesPreciseAmountCents: 200,
    totalAmountCents: '120000',
    preciseTotalAmountCents: 1200,
    units: 1,
    eventsCount: '0',
    payInAdvance: false,
    feeType: FeeTypesEnum.Subscription,
    itemCode: 'plan-code',
    itemName: 'Premium Plan',
    itemType: 'Subscription',
    invoiceDisplayName: 'Premium Plan',
    properties: {
      fromDatetime: '2026-05-01T00:00:00Z',
      toDatetime: '2026-05-31T23:59:59Z',
    },
    trueUpParentFee: null,
    subscription: {
      id: 'sub-1',
      plan: { id: 'plan-1', name: 'Premium', interval: PlanInterval.Monthly },
    },
    charge: null,
    fixedCharge: null,
    addOn: null,
    presentationBreakdowns: null,
    ...overrides,
  }) as unknown as FeeForViewFeeDetailsDrawerFragment

const buildProductFee = (
  overrides: Partial<FeeForViewFeeDetailsDrawerFragment> = {},
): FeeForViewFeeDetailsDrawerFragment =>
  buildFee({
    feeType: FeeTypesEnum.Product,
    itemCode: 'emails',
    itemName: 'Emails',
    itemType: 'Product',
    invoiceDisplayName: null,
    invoiceName: 'Email volume',
    subscription: null,
    product: {
      id: 'product-1',
      code: 'emails',
      name: 'Emails',
      invoiceDisplayName: 'Email volume',
      productType: ProductTypeEnum.Metered,
      productCategory: {
        id: 'category-1',
        code: 'comms',
        name: 'Communications',
        invoiceDisplayName: null,
      },
    },
    productFilter: { id: 'filter-1', code: 'eu', name: 'EU', invoiceDisplayName: null },
    contractRateCard: {
      id: 'crc-1',
      rateCard: { id: 'rc-1', code: 'rc-emails', name: 'Emails rate card', displayOnInvoice: true },
    },
    rateOverride: null,
    ...overrides,
  })

// The hook now reads from `ViewFeeDetailsDrawerProvider`, so each test mounts
// the provider — the same shape that real consumers (e.g. InvoiceOverview) use.
const renderHookUnderTest = () =>
  renderHook(() => useViewFeeDetailsDrawer(), {
    wrapper: ({ children }) => (
      <AllTheProviders>
        <ViewFeeDetailsDrawerProvider>{children}</ViewFeeDetailsDrawerProvider>
      </AllTheProviders>
    ),
  })

// Get the children passed to the most recent drawer.open() call so we can mount
// them in isolation and assert on the actual DOM.
const getBodyFromLastOpen = (): ReactNode => {
  const lastCall = mockDrawerOpen.mock.calls[mockDrawerOpen.mock.calls.length - 1]

  return (lastCall?.[0] as { children: ReactNode } | undefined)?.children
}

describe('useViewFeeDetailsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is mounted but never invoked', () => {
    it('THEN should NOT call drawer.open', () => {
      renderHookUnderTest()

      expect(mockDrawerOpen).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN open is invoked with a fee', () => {
    it('THEN should call drawer.open with title, children and actions', () => {
      const { result } = renderHookUnderTest()

      result.current.open(buildFee())

      expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
      expect(mockDrawerOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          children: expect.anything(),
          actions: expect.anything(),
        }),
      )
    })
  })

  describe('GIVEN close is invoked', () => {
    it('THEN should call drawer.close', () => {
      const { result } = renderHookUnderTest()

      result.current.close()

      expect(mockDrawerClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN a fee without presentation breakdowns', () => {
    describe('WHEN the drawer body is rendered', () => {
      it.each([
        ['drawer container', VIEW_FEE_DETAILS_DRAWER_TEST_ID],
        ['header', VIEW_FEE_DETAILS_HEADER_TEST_ID],
        ['overview section', VIEW_FEE_DETAILS_OVERVIEW_TEST_ID],
        ['source item section', VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID],
      ])('THEN should render the %s (single-view variant)', (_, testId) => {
        const { result } = renderHookUnderTest()

        result.current.open(buildFee())
        // The drawer body wraps itself in a <MemoryRouter>; use plain RTL
        // render here so we don't end up with nested Routers.
        plainRender(<>{getBodyFromLastOpen()}</>)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a fee with presentation breakdowns', () => {
    describe('WHEN the drawer body is rendered', () => {
      it('THEN should render Overview and Presentation group key tabs', () => {
        const { result } = renderHookUnderTest()

        result.current.open(
          buildFee({
            presentationBreakdowns: [{ presentationBy: { region: 'us-east' }, units: '60' }],
          } as unknown as Partial<FeeForViewFeeDetailsDrawerFragment>),
        )
        plainRender(<>{getBodyFromLastOpen()}</>)

        expect(screen.getByTestId(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID)).toBeInTheDocument()
        expect(screen.getAllByRole('tab').length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('GIVEN a fee with a trueUpParentFee in the tabbed variant', () => {
    describe('WHEN the Overview tab is rendered', () => {
      it('THEN should display the parent fee id in the Parent ID row', () => {
        const { result } = renderHookUnderTest()

        result.current.open(
          buildFee({
            trueUpParentFee: { id: 'parent-fee-1' },
            presentationBreakdowns: [{ presentationBy: { region: 'us' }, units: '10' }],
          } as unknown as Partial<FeeForViewFeeDetailsDrawerFragment>),
        )
        plainRender(<>{getBodyFromLastOpen()}</>)

        expect(screen.getAllByText('parent-fee-1').length).toBeGreaterThan(0)
      })

      it('THEN should NOT render the Parent ID row when trueUpParentFee is null', () => {
        const { result } = renderHookUnderTest()

        result.current.open(
          buildFee({
            trueUpParentFee: null,
            presentationBreakdowns: [{ presentationBy: { region: 'us' }, units: '10' }],
          } as unknown as Partial<FeeForViewFeeDetailsDrawerFragment>),
        )
        plainRender(<>{getBodyFromLastOpen()}</>)

        expect(screen.queryByText('parent-fee-1')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a product catalog fee', () => {
    const renderProductFee = (overrides: Partial<FeeForViewFeeDetailsDrawerFragment> = {}) => {
      const { result } = renderHookUnderTest()

      result.current.open(buildProductFee(overrides))
      plainRender(<>{getBodyFromLastOpen()}</>)
    }

    const getRowValue = (sectionTestId: string, label: string): string | null | undefined =>
      within(screen.getByTestId(sectionTestId)).getByText(label).nextElementSibling?.textContent

    describe('WHEN the fee has a product filter', () => {
      it('THEN should title the drawer with the filter name', () => {
        renderProductFee()

        expect(screen.getByTestId(VIEW_FEE_DETAILS_HEADER_TEST_ID)).toHaveTextContent('EU')
      })

      it('THEN should prefer the filter invoice display name over its name', () => {
        renderProductFee({
          productFilter: { id: 'filter-1', code: 'eu', name: 'EU', invoiceDisplayName: 'Europe' },
        })

        expect(screen.getByTestId(VIEW_FEE_DETAILS_HEADER_TEST_ID)).toHaveTextContent('Europe')
      })
    })

    describe('WHEN the fee has no product filter', () => {
      it('THEN should title the drawer with the fee invoice name, not the item name', () => {
        renderProductFee({ productFilter: null })

        const header = screen.getByTestId(VIEW_FEE_DETAILS_HEADER_TEST_ID)

        expect(within(header).getByText('Email volume')).toBeInTheDocument()
        expect(within(header).queryByText('Emails')).not.toBeInTheDocument()
      })
    })

    describe('WHEN the overview is rendered', () => {
      it.each([
        ['arrears', false, 'Arrears'],
        ['advance', true, 'Advance'],
      ])('THEN should show the %s billing time', (_, payInAdvance, expected) => {
        renderProductFee({ payInAdvance })

        expect(getRowValue(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID, 'Billing time')).toBe(expected)
      })

      it('THEN should replace the pay in advance and invoiceable rows', () => {
        renderProductFee()

        const overview = screen.getByTestId(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID)

        expect(within(overview).queryByText('Pay in advance')).not.toBeInTheDocument()
        expect(within(overview).queryByText('Invoiceable')).not.toBeInTheDocument()
      })

      it.each([
        ['displayed on invoice', true, 'True'],
        ['hidden from invoice', false, 'False'],
      ])('THEN should show the rate card as %s', (_, displayOnInvoice, expected) => {
        renderProductFee({
          contractRateCard: {
            id: 'crc-1',
            rateCard: { id: 'rc-1', code: 'rc-emails', name: 'Emails rate card', displayOnInvoice },
          },
        })

        expect(getRowValue(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID, 'Display on invoice')).toBe(expected)
      })

      it('THEN should show a dash for display on invoice without a contract rate card', () => {
        renderProductFee({ contractRateCard: null })

        expect(getRowValue(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID, 'Display on invoice')).toBe('-')
      })

      it('THEN should keep the precise amount rows', () => {
        renderProductFee()

        const overview = screen.getByTestId(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID)

        expect(within(overview).getByText('Precise amount')).toBeInTheDocument()
        expect(within(overview).getByText('Precise coupon')).toBeInTheDocument()
        expect(within(overview).getByText('Precise sub total (excl. tax)')).toBeInTheDocument()
      })
    })

    describe('WHEN the fee is a true-up without presentation breakdowns', () => {
      it('THEN should show the parent fee id', () => {
        renderProductFee({ trueUpParentFee: { id: 'parent-fee-1' } })

        expect(getRowValue(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID, 'Parent ID')).toBe('parent-fee-1')
      })
    })

    describe('WHEN the fee is not a true-up', () => {
      it('THEN should not show the parent ID row', () => {
        renderProductFee({ trueUpParentFee: null })

        expect(
          within(screen.getByTestId(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID)).queryByText('Parent ID'),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the source item section is rendered', () => {
      it.each([
        ['product category', 'Product category', 'Communications'],
        ['product', 'Product', 'Email volume'],
        ['product filter', 'Product filter', 'EU'],
        ['item type', 'Item type', 'Metered'],
        ['rate card', 'Rate card', 'Emails rate card'],
        ['rate card code', 'Rate card code', 'rc-emails'],
        ['rate override flag', 'Rate overridden', 'False'],
      ])('THEN should show the %s', (_, label, expected) => {
        renderProductFee()

        expect(getRowValue(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID, label)).toBe(expected)
      })

      it('THEN should show the category, product and filter codes in design order', () => {
        renderProductFee()

        const codes = within(screen.getByTestId(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID))
          .getAllByText('Code')
          .map((label) => label.nextElementSibling?.textContent)

        expect(codes).toEqual(['comms', 'emails', 'eu'])
      })

      it('THEN should not show the V1 type and name rows', () => {
        renderProductFee()

        const sourceItem = screen.getByTestId(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID)

        expect(within(sourceItem).queryByText('Type')).not.toBeInTheDocument()
        expect(within(sourceItem).queryByText('Name')).not.toBeInTheDocument()
      })

      it('THEN should show the fixed item type for a fixed product', () => {
        renderProductFee({
          product: {
            id: 'product-1',
            code: 'seats',
            name: 'Seats',
            invoiceDisplayName: null,
            productType: ProductTypeEnum.Fixed,
            productCategory: null,
          },
        })

        expect(getRowValue(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID, 'Item type')).toBe('Fixed')
      })

      it('THEN should flag an overridden rate', () => {
        renderProductFee({ rateOverride: { id: 'ro-1' } })

        expect(getRowValue(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID, 'Rate overridden')).toBe('True')
      })
    })

    describe('WHEN the category, filter and contract rate card are missing', () => {
      it('THEN should omit their rows and keep the product and rate override rows', () => {
        renderProductFee({
          product: {
            id: 'product-1',
            code: 'emails',
            name: 'Emails',
            invoiceDisplayName: null,
            productType: ProductTypeEnum.Metered,
            productCategory: null,
          },
          productFilter: null,
          contractRateCard: null,
        })

        const sourceItem = screen.getByTestId(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID)

        expect(within(sourceItem).queryByText('Product category')).not.toBeInTheDocument()
        expect(within(sourceItem).queryByText('Product filter')).not.toBeInTheDocument()
        expect(within(sourceItem).queryByText('Rate card')).not.toBeInTheDocument()
        expect(within(sourceItem).queryByText('Rate card code')).not.toBeInTheDocument()
        expect(getRowValue(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID, 'Product')).toBe('Emails')
        expect(within(sourceItem).getByText('Rate overridden')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a subscription fee', () => {
    describe('WHEN the drawer body is rendered', () => {
      it('THEN should keep the V1 overview and source item rows', () => {
        const { result } = renderHookUnderTest()

        result.current.open(buildFee())
        plainRender(<>{getBodyFromLastOpen()}</>)

        const overview = screen.getByTestId(VIEW_FEE_DETAILS_OVERVIEW_TEST_ID)
        const sourceItem = screen.getByTestId(VIEW_FEE_DETAILS_SOURCE_ITEM_TEST_ID)

        expect(within(overview).getByText('Pay in advance')).toBeInTheDocument()
        expect(within(overview).getByText('Invoiceable')).toBeInTheDocument()
        expect(within(overview).queryByText('Billing time')).not.toBeInTheDocument()
        expect(within(sourceItem).getByText('Type')).toBeInTheDocument()
        expect(within(sourceItem).getByText('Name')).toBeInTheDocument()
        expect(within(sourceItem).queryByText('Rate overridden')).not.toBeInTheDocument()
      })
    })
  })
})
