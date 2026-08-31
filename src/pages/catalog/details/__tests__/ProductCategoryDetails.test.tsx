import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { GetProductCategoryForDetailsDocument } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ProductCategoryDetails from '../ProductCategoryDetails'

const mockOpenEditProductCategoryDrawer = jest.fn()
const mockOpenDeleteProductCategoryDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/productCategory/useProductCategoryDrawer', () => ({
  useProductCategoryDrawer: () => ({ openDrawer: mockOpenEditProductCategoryDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductCategoryDialog', () => ({
  useDeleteProductCategoryDialog: () => ({
    openDeleteProductCategoryDialog: mockOpenDeleteProductCategoryDialog,
  }),
}))

// The product-items tab preview pulls the product-item drawer chain (drawerStack
// uses import.meta and crashes Jest); this suite only exercises the header/tabs.
jest.mock('../ProductCategoryDetailsProducts', () => ({
  ProductCategoryDetailsProducts: () => null,
}))

const mockProductCategoryActivityLogsProps = jest.fn()

jest.mock('../ProductCategoryActivityLogs', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockProductCategoryActivityLogsProps(props)
    return null
  },
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const productCategoryFixture = {
  __typename: 'ProductCategory',
  id: 'prod-1',
  name: 'Object storage',
  code: 'object_storage',
  description: 'Base storage productCategory',
  invoiceDisplayName: 'Storage',
  attachedToPlanOrSubscription: false,
}

const detailsQueryMock = {
  request: { query: GetProductCategoryForDetailsDocument, variables: { id: 'prod-1' } },
  result: { data: { productCategory: productCategoryFixture } },
}

const ProductCategoryDetailsWithHeader = () => (
  <>
    <MainHeader />
    <ProductCategoryDetails />
  </>
)

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderPage = (tab = 'overview') => {
  window.history.pushState({}, '', `/product-catalog/product-categories/prod-1/${tab}`)

  return rtlRender(<ProductCategoryDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ productCategoryId: 'prod-1', tab }}
      >
        {children}
      </AllTheProviders>
    ),
  })
}

describe('ProductCategoryDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
  })

  it('displays the productCategory name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Object storage',
      )
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
      'object_storage',
    )
  })

  it('renders the catalog breadcrumb link and the static grey productCategory crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/product-categories')
    expect(
      screen.queryByRole('link', { name: 'text_1783020794399ai60io2ufkg' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('text_1783020794399ai60io2ufkg')).toBeInTheDocument()
  })

  it('shows the overview, products and plans tabs, plus activity logs for premium', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_17831042398250iwa2xp8pba')).toBeInTheDocument()
    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('renders the activity logs tab content scoped to the product category', async () => {
    await act(() => renderPage('activity-logs'))

    await waitFor(() => {
      expect(mockProductCategoryActivityLogsProps).toHaveBeenCalledWith(
        expect.objectContaining({ productCategoryId: 'prod-1' }),
      )
    })
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('opens the edit drawer with the loaded productCategory from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-details-edit'))

    expect(mockOpenEditProductCategoryDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-1', code: 'object_storage' }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the productCategories list', async () => {
    await act(() => renderPage())

    await userEvent.click((await screen.findAllByTestId('product-details-actions'))[0])
    await userEvent.click(screen.getByTestId('product-details-delete'))

    expect(mockOpenDeleteProductCategoryDialog).toHaveBeenCalledWith(
      expect.objectContaining({ productCategory: expect.objectContaining({ id: 'prod-1' }) }),
    )

    const { callback } = mockOpenDeleteProductCategoryDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/product-categories')
  })

  it('hides the whole actions dropdown without the update and delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
        'Object storage',
      )
    })
    expect(screen.queryByTestId('product-details-actions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('product-details-edit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('product-details-delete')).not.toBeInTheDocument()
  })
})
