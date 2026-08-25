import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GetProductFilterForDetailsOverviewDocument,
  ProductFilterForDetailsOverviewFragment,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import ProductFilterDetailsOverview, {
  PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID,
  PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID,
} from '../ProductFilterDetailsOverview'

const mockOpenEditProductFilterDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/productFilter/useProductFilterDrawer', () => ({
  useProductFilterDrawer: () => ({ openDrawer: mockOpenEditProductFilterDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const attachedProductFilter: ProductFilterForDetailsOverviewFragment = {
  __typename: 'ProductFilter',
  id: 'filter-1',
  name: 'EU pro filter',
  code: 'eu_pro_filter',
  description: 'Filters EU pro customers',
  invoiceDisplayName: 'EU Pro',
  attachedToPlanOrSubscription: false,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    invoiceDisplayName: 'Seat charge',
    productCategory: {
      __typename: 'ProductCategory',
      id: 'prod-1',
      name: 'Object storage',
      code: 'object_storage',
    },
  },
  values: [
    {
      __typename: 'ProductFilterValue',
      id: 'val-1',
      key: 'region',
      value: 'EU',
      billableMetricFilter: {
        __typename: 'BillableMetricFilter',
        id: 'bmf-1',
        key: 'region',
        values: ['EU', 'US'],
      },
    },
    {
      __typename: 'ProductFilterValue',
      id: 'val-2',
      key: 'plan',
      value: 'pro',
      billableMetricFilter: {
        __typename: 'BillableMetricFilter',
        id: 'bmf-2',
        key: 'plan',
        values: ['pro', 'basic'],
      },
    },
  ],
}

const noProductCategoryProductFilter: ProductFilterForDetailsOverviewFragment = {
  ...attachedProductFilter,
  product: {
    ...attachedProductFilter.product,
    productCategory: null,
  },
}

// A parent-key ("all values") selection: the value is null, so the chip shows
// the bare key instead of "key: value".
const parentKeyProductFilter: ProductFilterForDetailsOverviewFragment = {
  ...attachedProductFilter,
  values: [
    {
      __typename: 'ProductFilterValue',
      id: 'val-1',
      key: 'region',
      value: null,
      billableMetricFilter: {
        __typename: 'BillableMetricFilter',
        id: 'bmf-1',
        key: 'region',
        values: ['EU', 'US'],
      },
    },
  ],
}

const buildMock = (productFilter: ProductFilterForDetailsOverviewFragment): TestMocksType => [
  {
    request: {
      query: GetProductFilterForDetailsOverviewDocument,
      variables: { id: 'filter-1' },
    },
    result: { data: { productFilter } },
  },
]

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (
  productFilter: ProductFilterForDetailsOverviewFragment = attachedProductFilter,
) =>
  rtlRender(<ProductFilterDetailsOverview productFilterId="filter-1" />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={buildMock(productFilter)}>
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductFilterDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN the overview is loading', () => {
    describe('WHEN the query has not resolved yet', () => {
      it('THEN displays the skeleton', () => {
        const { container } = renderOverview()

        expect(screen.queryByText('EU pro filter')).not.toBeInTheDocument()
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a filter attached to a product with a productCategory', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the name, code, description and invoice display name', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('EU pro filter')).toBeInTheDocument()
        expect(screen.getByText('eu_pro_filter')).toBeInTheDocument()
        expect(screen.getByText('Filters EU pro customers')).toBeInTheDocument()
        expect(screen.getByText('EU Pro')).toBeInTheDocument()
      })

      it('THEN links to the attached productCategory', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Object storage' })).toBeInTheDocument()
      })

      it('THEN links to the attached product', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Seat charge' })).toBeInTheDocument()
      })

      it('THEN renders the filter-by chips joined by AND', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('region: EU')).toBeInTheDocument()
        expect(screen.getByText('plan: pro')).toBeInTheDocument()
        expect(screen.getByText('text_65f8472df7593301061e27d6')).toBeInTheDocument()
      })

      it('THEN renders a parent-key selection as the bare key', async () => {
        await act(() => renderOverview(parentKeyProductFilter))

        expect(await screen.findByText('region')).toBeInTheDocument()
        expect(screen.queryByText('region: EU')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a filter whose product has no attached productCategory', () => {
    describe('WHEN the overview loads', () => {
      it('THEN shows the no-productCategory fallback', async () => {
        await act(() => renderOverview(noProductCategoryProductFilter))

        expect(await screen.findByText('EU pro filter')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Object storage' })).not.toBeInTheDocument()
        expect(
          screen.getByTestId(PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_CATEGORY_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the update permission', () => {
    describe('WHEN the edit button is clicked', () => {
      it('THEN opens the drawer with the loaded product filter', async () => {
        await act(() => renderOverview())

        await userEvent.click(
          await screen.findByTestId(PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID),
        )

        expect(mockOpenEditProductFilterDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            productFilter: expect.objectContaining({ id: 'filter-1', code: 'eu_pro_filter' }),
          }),
        )
      })
    })
  })

  describe('GIVEN no update permission', () => {
    describe('WHEN the overview loads', () => {
      it('THEN hides the edit button', async () => {
        mockHasPermissions.mockReturnValue(false)

        await act(() => renderOverview())

        await waitFor(() => {
          expect(screen.getByText('EU pro filter')).toBeInTheDocument()
        })
        expect(
          screen.queryByTestId(PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
