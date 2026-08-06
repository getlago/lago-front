import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  GetProductForDetailsOverviewDocument,
  ProductForDetailsOverviewFragment,
  ProductTypeEnum,
} from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import {
  PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID,
  ProductDetailsOverview,
} from '../ProductDetailsOverview'

const mockOpenEditProductDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenEditProductDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const fixedProduct: ProductForDetailsOverviewFragment = {
  __typename: 'Product',
  id: 'pitem-1',
  name: 'Seats',
  code: 'seats',
  description: 'Per seat billing',
  invoiceDisplayName: 'Seat charge',
  productType: ProductTypeEnum.Fixed,
  attachedToPlanOrSubscription: false,
  productCategory: {
    __typename: 'ProductCategory',
    id: 'prod-1',
    name: 'Object storage',
    code: 'object_storage',
  },
  billableMetric: null,
}

const usageProduct: ProductForDetailsOverviewFragment = {
  ...fixedProduct,
  description: null,
  invoiceDisplayName: null,
  productType: ProductTypeEnum.Usage,
  productCategory: null,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm-1',
    name: 'API calls',
    code: 'api_calls',
  },
}

const buildMock = (product: ProductForDetailsOverviewFragment): TestMocksType => [
  {
    request: {
      query: GetProductForDetailsOverviewDocument,
      variables: { id: 'pitem-1' },
    },
    result: { data: { product } },
  },
]

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (product: ProductForDetailsOverviewFragment = fixedProduct) =>
  rtlRender(<ProductDetailsOverview />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={buildMock(product)}
        useParams={{ productId: 'pitem-1' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN a fixed product attached to a productCategory', () => {
    describe('WHEN the overview loads', () => {
      it('THEN displays the item name, code, description and invoice display name', async () => {
        await act(() => renderOverview())

        expect(await screen.findByText('Seats')).toBeInTheDocument()
        expect(screen.getByText('seats')).toBeInTheDocument()
        expect(screen.getByText('Per seat billing')).toBeInTheDocument()
        expect(screen.getByText('Seat charge')).toBeInTheDocument()
      })

      it('THEN links to the attached productCategory details', async () => {
        await act(() => renderOverview())

        expect(await screen.findByRole('link', { name: 'Object storage' })).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a usage product with a billable metric', () => {
    describe('WHEN the overview loads', () => {
      it('THEN links to the billable metric details', async () => {
        await act(() => renderOverview(usageProduct))

        expect(await screen.findByRole('link', { name: 'API calls' })).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the update permission', () => {
    describe('WHEN the edit button is clicked', () => {
      it('THEN opens the drawer with the loaded product', async () => {
        await act(() => renderOverview())

        await userEvent.click(await screen.findByTestId(PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID))

        expect(mockOpenEditProductDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            product: expect.objectContaining({ id: 'pitem-1', code: 'seats' }),
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
          expect(screen.getByText('Seats')).toBeInTheDocument()
        })
        expect(screen.queryByTestId(PRODUCT_ITEM_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
