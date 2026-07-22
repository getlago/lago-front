import { MockedResponse } from '@apollo/client/testing'
import { act, fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GetProductItemFiltersForProductItemDetailsDocument,
  ProductItemFilterForListFragment,
  ProductItemForFilterPreviewFragment,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import ProductItemFilterPreview, {
  PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID,
  PRODUCT_ITEM_FILTER_PREVIEW_EMPTY_TEST_ID,
  PRODUCT_ITEM_FILTER_PREVIEW_VIEW_ALL_TEST_ID,
} from '../ProductItemFilterPreview'

const mockOpenDrawer = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductItemFilterDialog', () => ({
  useDeleteProductItemFilterDialog: () => ({
    openDeleteProductItemFilterDialog: mockOpenDeleteDialog,
  }),
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

const PRODUCT_ITEM_ID = 'pi-1'

const billableMetricFilterFixture = { id: 'bmf-1', key: 'region', values: ['eu', 'us'] }

const productItemWithFilters: ProductItemForFilterPreviewFragment = {
  __typename: 'ProductItem',
  id: PRODUCT_ITEM_ID,
  name: 'Seats',
  code: 'seats',
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm-1',
    filters: [billableMetricFilterFixture],
  },
}

const productItemWithoutFilters: ProductItemForFilterPreviewFragment = {
  __typename: 'ProductItem',
  id: PRODUCT_ITEM_ID,
  name: 'Seats',
  code: 'seats',
  billableMetric: { __typename: 'BillableMetric', id: 'bm-1', filters: [] },
}

const buildRow = (index: number): ProductItemFilterForListFragment => ({
  __typename: 'ProductItemFilter',
  id: `pif-${index}`,
  name: `Filter ${index}`,
  code: `filter_${index}`,
  invoiceDisplayName: null,
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  productItem: {
    __typename: 'ProductItem',
    id: PRODUCT_ITEM_ID,
    name: 'Seats',
    invoiceDisplayName: null,
    code: 'seats',
  },
  values: [],
})

const filtersQueryMock = (
  variables: Record<string, unknown>,
  collection: ProductItemFilterForListFragment[],
  totalCount: number,
): MockedResponse => ({
  request: { query: GetProductItemFiltersForProductItemDetailsDocument, variables },
  result: {
    data: {
      productItemFilters: {
        __typename: 'ProductItemFilterCollection',
        metadata: { __typename: 'CollectionMetadata', totalCount },
        collection,
      },
    },
  },
})

const renderPreview = (
  mocks: MockedResponse[],
  productItem: ProductItemForFilterPreviewFragment = productItemWithFilters,
) =>
  rtlRender(<ProductItemFilterPreview productItem={productItem} />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={mocks}>
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductItemFilterPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('renders up to the preview limit of rows returned by the scoped query', async () => {
    const collection = Array.from({ length: 7 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([
        filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, collection, 7),
      ]),
    )

    await waitFor(() => {
      expect(screen.getAllByText(/^Filter \d$/)).toHaveLength(7)
    })
  })

  it('re-runs the query with the search term when the user searches', async () => {
    await act(() =>
      renderPreview([
        filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, [buildRow(1)], 1),
        filtersQueryMock(
          { productItemId: PRODUCT_ITEM_ID, limit: 7, searchTerm: 'region' },
          [{ ...buildRow(9), name: 'Searched region' }],
          1,
        ),
      ]),
    )

    fireEvent.change(screen.getByPlaceholderText('text_17845854002450t175dwblcq'), {
      target: { value: 'region' },
    })

    expect(await screen.findByText('Searched region', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('shows the view-all link deep-linked to this product item when the total exceeds the preview limit', async () => {
    const collection = Array.from({ length: 7 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([
        filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, collection, 12),
      ]),
    )

    const viewAll = await screen.findByTestId(PRODUCT_ITEM_FILTER_PREVIEW_VIEW_ALL_TEST_ID)
    const anchor = viewAll.closest('a')

    expect(anchor).toBeInTheDocument()
    expect(decodeURIComponent(anchor?.getAttribute('href') ?? '')).toContain(
      'pif_productItemFilterProductItem=pi-1|-_-|Seats',
    )
    expect(anchor?.getAttribute('href')).toContain('/product-catalog/product-item-filters')
  })

  it('hides the view-all link when the total fits within the preview limit', async () => {
    const collection = Array.from({ length: 5 }, (_, index) => buildRow(index + 1))

    await act(() =>
      renderPreview([
        filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, collection, 5),
      ]),
    )

    await waitFor(() => {
      expect(screen.getAllByText(/^Filter \d$/)).toHaveLength(5)
    })
    expect(
      screen.queryByTestId(PRODUCT_ITEM_FILTER_PREVIEW_VIEW_ALL_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('opens the drawer prefilled with this product item when the create button is clicked', async () => {
    await act(() =>
      renderPreview([filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    await userEvent.click(screen.getByTestId(PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID))

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      attachToProductItem: {
        id: PRODUCT_ITEM_ID,
        name: 'Seats',
        code: 'seats',
        billableMetricFilters: [billableMetricFilterFixture],
      },
    })
  })

  it('hides the create button without the create permission', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() =>
      renderPreview([filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    expect(screen.queryByTestId(PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID)).not.toBeInTheDocument()
  })

  it('hides the create button when the product item has no billable metric filters', async () => {
    await act(() =>
      renderPreview(
        [filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)],
        productItemWithoutFilters,
      ),
    )

    expect(screen.queryByTestId(PRODUCT_ITEM_FILTER_PREVIEW_CREATE_TEST_ID)).not.toBeInTheDocument()
  })

  it('renders the inline dashed empty box when there are no filters and no active search', async () => {
    await act(() =>
      renderPreview([filtersQueryMock({ productItemId: PRODUCT_ITEM_ID, limit: 7 }, [], 0)]),
    )

    const emptyBox = await screen.findByTestId(PRODUCT_ITEM_FILTER_PREVIEW_EMPTY_TEST_ID)

    expect(emptyBox).toBeInTheDocument()
    expect(emptyBox).toHaveClass('border-dashed')
    expect(screen.getByText('text_1784585400245a6ghyeaz5wf')).toBeInTheDocument()
  })
})
