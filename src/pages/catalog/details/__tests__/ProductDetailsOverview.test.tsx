import { act, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetProductForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { PRODUCT_OVERVIEW_EDIT_TEST_ID, ProductDetailsOverview } from '../ProductDetailsOverview'

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

const productFixture = {
  __typename: 'Product',
  id: 'prod-1',
  name: 'Object storage',
  code: 'object_storage',
  description: 'Base storage product',
  invoiceDisplayName: 'Storage',
  attachedToPlanOrSubscription: false,
}

const overviewQueryMockFactory = (product: Record<string, unknown>) => ({
  request: { query: GetProductForDetailsOverviewDocument, variables: { id: 'prod-1' } },
  result: { data: { product } },
})

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (product: Record<string, unknown> = productFixture) =>
  rtlRender(<ProductDetailsOverview />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[overviewQueryMockFactory(product)]}
        useParams={{ productId: 'prod-1' }}
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

  it('displays the product information values', async () => {
    await act(() => renderOverview())

    expect(await screen.findByText('Object storage')).toBeInTheDocument()
    expect(screen.getByText('object_storage')).toBeInTheDocument()
    expect(screen.getByText('Base storage product')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
  })

  it('falls back to a dash for empty description and invoice display name', async () => {
    await act(() =>
      renderOverview({ ...productFixture, description: null, invoiceDisplayName: null }),
    )

    expect(await screen.findByText('Object storage')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2)
  })

  it('opens the edit drawer with the loaded product', async () => {
    await act(() => renderOverview())

    await screen.findByText('Object storage')
    await userEvent.click(screen.getByTestId(PRODUCT_OVERVIEW_EDIT_TEST_ID))

    expect(mockOpenEditProductDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-1', code: 'object_storage' }),
    )
  })

  it('hides the edit button without the productsUpdate permission', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderOverview())

    await screen.findByText('Object storage')

    expect(screen.queryByTestId(PRODUCT_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })
})
