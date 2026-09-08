import { MockedResponse } from '@apollo/client/testing'
import {
  act,
  configure,
  fireEvent,
  getConfig,
  render as rtlRender,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import {
  CurrencyEnum,
  GetRateCardsForProductDetailsDocument,
  GetRateCardsForProductFilterDetailsDocument,
  RateCardForListFragment,
  RateCardRateModelEnum,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'
import { DEBOUNCE_SEARCH_MS } from '~/hooks/useDebouncedSearch'
import { AllTheProviders } from '~/test-utils'

import RateCardPreview, {
  RATE_CARD_PREVIEW_CREATE_TEST_ID,
  RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID,
  RateCardPreviewScope,
} from '../RateCardPreview'

const mockOpenDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}|${Object.values(vars).join('|')}` : key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 20, 2024', time: '00:00' }),
  }),
}))

const PRODUCT_ITEM_ID = 'pitem-1'
const PRODUCT_ITEM_FILTER_ID = 'pif-1'

const productScope: RateCardPreviewScope = {
  product: { id: PRODUCT_ITEM_ID, name: 'Seats' },
}

const productFilterScope: RateCardPreviewScope = {
  productFilter: {
    id: PRODUCT_ITEM_FILTER_ID,
    name: 'Region',
    product: { id: PRODUCT_ITEM_ID, name: 'Seats' },
  },
}

const buildRow = (index: number): RateCardForListFragment => ({
  __typename: 'RateCard',
  id: `rc-${index}`,
  name: `Rate card ${index}`,
  code: `rate_card_${index}`,
  createdAt: '2024-01-20T00:00:00Z',
  ratesCount: 1,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  description: null,
  billingTiming: 'advance' as RateCardForListFragment['billingTiming'],
  displayOnInvoice: true,
  regroupPaidFees: RateCardRegroupPaidFeesEnum.None,
  proration: false,
  walletTargetable: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: PRODUCT_ITEM_ID,
    name: 'Seats',
    code: 'seats',
    productType: 'metered' as RateCardForListFragment['product']['productType'],
    billableMetric: null,
  },
  productFilter: null,
  taxes: [],
  activeRate: {
    __typename: 'RateCardRate',
    id: `rate-${index}`,
    rateModel: RateCardRateModelEnum.Standard,
    rateProperties: { amount: '10' },
    minAmountCents: 0,
  },
})

const productQueryMock = (
  variables: Record<string, unknown>,
  collection: RateCardForListFragment[],
  totalCount: number,
): MockedResponse => ({
  request: { query: GetRateCardsForProductDetailsDocument, variables },
  result: {
    data: {
      rateCards: {
        __typename: 'RateCardCollection',
        metadata: { __typename: 'CollectionMetadata', totalCount },
        collection,
      },
    },
  },
})

const productFilterQueryMock = (
  variables: Record<string, unknown>,
  collection: RateCardForListFragment[],
  totalCount: number,
): MockedResponse => ({
  request: { query: GetRateCardsForProductFilterDetailsDocument, variables },
  result: {
    data: {
      rateCards: {
        __typename: 'RateCardCollection',
        metadata: { __typename: 'CollectionMetadata', totalCount },
        collection,
      },
    },
  },
})

const renderPreview = (mocks: MockedResponse[], scope: RateCardPreviewScope = productScope) =>
  rtlRender(<RateCardPreview scope={scope} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={mocks}>
        {children}
      </AllTheProviders>
    ),
  })

describe('RateCardPreview', () => {
  // Every case here renders behind useDebouncedSearch's loading-blink timer, which burns up
  // to DEBOUNCE_SEARCH_MS of real time before rows paint. RTL's 1s default leaves almost no
  // headroom for that on a loaded CI runner, so widen it for this file only.
  const originalAsyncUtilTimeout = getConfig().asyncUtilTimeout

  beforeAll(() => {
    configure({ asyncUtilTimeout: 5000 })
  })

  afterAll(() => {
    configure({ asyncUtilTimeout: originalAsyncUtilTimeout })
  })
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders up to the preview limit of rows returned by the scoped query', async () => {
    const collection = Array.from({ length: 7 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, collection, 7)]),
    )

    await waitFor(() => {
      expect(screen.getAllByText(/^Rate card \d$/)).toHaveLength(7)
    })
  })

  it('re-runs the query with the search term when the user searches', async () => {
    // The search runs through useDebouncedSearch, which burns DEBOUNCE_SEARCH_MS on a real
    // timer plus a second delay in its loading-blink guard. Waiting that out on the wall
    // clock makes the assertion race CI load, so drive the timers explicitly instead.
    jest.useFakeTimers()

    await act(() =>
      renderPreview([
        productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, [buildRow(1)], 1),
        productQueryMock(
          { productId: PRODUCT_ITEM_ID, limit: 7, searchTerm: 'region' },
          [{ ...buildRow(9), name: 'Searched rate card' }],
          1,
        ),
      ]),
    )

    fireEvent.change(screen.getByPlaceholderText('text_17849293094725tv045xhkxf'), {
      target: { value: 'region' },
    })

    // First pass fires the debounced query, second flushes the mocked link and the
    // loading-blink timeout that gates the result render.
    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS)
    })
    await act(async () => {
      jest.advanceTimersByTime(DEBOUNCE_SEARCH_MS)
    })

    expect(screen.getByText('Searched rate card')).toBeInTheDocument()
  })

  it('shows the classic table placeholder (not a dashed box) when there are no rate cards and no active search', async () => {
    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    const emptyState = await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)

    expect(emptyState).toBeInTheDocument()
    expect(emptyState).not.toHaveClass('border-dashed')
    expect(screen.getByText('text_1784929309473260i6j8d7kb')).toBeInTheDocument()
  })

  it('shows the view-all link deep-linked to this product item when the total exceeds the preview limit', async () => {
    const collection = Array.from({ length: 7 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, collection, 12)]),
    )

    const viewAll = await screen.findByTestId(RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID)
    const anchor = viewAll.closest('a')

    expect(anchor).toBeInTheDocument()
    expect(decodeURIComponent(anchor?.getAttribute('href') ?? '')).toContain(
      'rc_rateCardProduct=pitem-1|-_-|Seats',
    )
    expect(anchor?.getAttribute('href')).toContain('/product-catalog/rate-cards')
  })

  it('hides the view-all link when the total fits within the preview limit', async () => {
    const collection = Array.from({ length: 5 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, collection, 5)]),
    )

    await waitFor(() => {
      expect(screen.getAllByText(/^Rate card \d$/)).toHaveLength(5)
    })
    expect(screen.queryByTestId(RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID)).not.toBeInTheDocument()
  })

  it('opens the drawer prefilled with this product item when the create button is clicked', async () => {
    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    await userEvent.click(screen.getByTestId(RATE_CARD_PREVIEW_CREATE_TEST_ID))

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      attachToProduct: { id: PRODUCT_ITEM_ID, name: 'Seats' },
    })
  })

  it('hides the create button without the create permission', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() =>
      renderPreview([productQueryMock({ productId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    expect(screen.queryByTestId(RATE_CARD_PREVIEW_CREATE_TEST_ID)).not.toBeInTheDocument()
  })

  describe('when scoped to a product item filter', () => {
    it('queries by productFilterId and deep-links the view-all to the filter', async () => {
      const collection = Array.from({ length: 7 }, (_, index) => buildRow(index + 1))

      await act(() =>
        renderPreview(
          [
            productFilterQueryMock(
              { productFilterId: PRODUCT_ITEM_FILTER_ID, limit: 7 },
              collection,
              9,
            ),
          ],
          productFilterScope,
        ),
      )

      const viewAll = await screen.findByTestId(RATE_CARD_PREVIEW_VIEW_ALL_TEST_ID)
      const anchor = viewAll.closest('a')

      expect(decodeURIComponent(anchor?.getAttribute('href') ?? '')).toContain(
        'rc_rateCardProductFilter=pif-1|-_-|Region',
      )
    })

    it('opens the drawer prefilled with this product item filter when the create button is clicked', async () => {
      await act(() =>
        renderPreview(
          [productFilterQueryMock({ productFilterId: PRODUCT_ITEM_FILTER_ID, limit: 7 }, [], 0)],
          productFilterScope,
        ),
      )

      await userEvent.click(screen.getByTestId(RATE_CARD_PREVIEW_CREATE_TEST_ID))

      expect(mockOpenDrawer).toHaveBeenCalledWith({
        attachToProductFilter: {
          id: PRODUCT_ITEM_FILTER_ID,
          name: 'Region',
          product: { id: PRODUCT_ITEM_ID, name: 'Seats' },
        },
      })
    })
  })
})
