import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GetProductItemFilterForDetailsOverviewDocument,
  ProductItemFilterForDetailsOverviewFragment,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import ProductItemFilterDetailsOverview, {
  PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID,
  PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_TEST_ID,
} from '../ProductItemFilterDetailsOverview'

const mockOpenEditProductItemFilterDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenEditProductItemFilterDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const attachedProductItemFilter: ProductItemFilterForDetailsOverviewFragment = {
  __typename: 'ProductItemFilter',
  id: 'filter-1',
  name: 'EU pro filter',
  code: 'eu_pro_filter',
  description: 'Filters EU pro customers',
  invoiceDisplayName: 'EU Pro',
  attachedToPlanOrSubscription: false,
  productItem: {
    __typename: 'ProductItem',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    invoiceDisplayName: 'Seat charge',
    product: {
      __typename: 'Product',
      id: 'prod-1',
      name: 'Object storage',
      code: 'object_storage',
    },
  },
  values: [
    {
      __typename: 'ProductItemFilterValue',
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
      __typename: 'ProductItemFilterValue',
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

const noProductProductItemFilter: ProductItemFilterForDetailsOverviewFragment = {
  ...attachedProductItemFilter,
  productItem: {
    ...attachedProductItemFilter.productItem,
    product: null,
  },
}

const buildMock = (
  productItemFilter: ProductItemFilterForDetailsOverviewFragment,
): TestMocksType => [
  {
    request: {
      query: GetProductItemFilterForDetailsOverviewDocument,
      variables: { id: 'filter-1' },
    },
    result: { data: { productItemFilter } },
  },
]

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (
  productItemFilter: ProductItemFilterForDetailsOverviewFragment = attachedProductItemFilter,
) =>
  rtlRender(<ProductItemFilterDetailsOverview productItemFilterId="filter-1" />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={buildMock(productItemFilter)}>
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductItemFilterDetailsOverview', () => {
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

  describe('GIVEN a filter attached to a product item with a product', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the name, code, description and invoice display name', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('EU pro filter')).toBeInTheDocument()
        expect(screen.getByText('eu_pro_filter')).toBeInTheDocument()
        expect(screen.getByText('Filters EU pro customers')).toBeInTheDocument()
        expect(screen.getByText('EU Pro')).toBeInTheDocument()
      })

      it('THEN links to the attached product', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Object storage' })).toBeInTheDocument()
      })

      it('THEN links to the attached product item', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Seat charge' })).toBeInTheDocument()
      })

      it('THEN renders the filter-by chips joined by AND', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('region: EU')).toBeInTheDocument()
        expect(screen.getByText('plan: pro')).toBeInTheDocument()
        expect(screen.getByText('text_65f8472df7593301061e27d6')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a filter whose product item has no attached product', () => {
    describe('WHEN the overview loads', () => {
      it('THEN shows the no-product fallback', async () => {
        await act(() => renderOverview(noProductProductItemFilter))

        expect(await screen.findByText('EU pro filter')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Object storage' })).not.toBeInTheDocument()
        expect(
          screen.getByTestId(PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_NO_PRODUCT_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the update permission', () => {
    describe('WHEN the edit button is clicked', () => {
      it('THEN opens the drawer with the loaded product item filter', async () => {
        await act(() => renderOverview())

        await userEvent.click(
          await screen.findByTestId(PRODUCT_ITEM_FILTER_DETAILS_OVERVIEW_EDIT_TEST_ID),
        )

        expect(mockOpenEditProductItemFilterDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            productItemFilter: expect.objectContaining({ id: 'filter-1', code: 'eu_pro_filter' }),
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
