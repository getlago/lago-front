import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import { GetProductItemFilterForDetailsDocument } from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import ProductItemFilterDetails, {
  PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID,
  PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID,
  PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID,
} from '../ProductItemFilterDetails'

const mockOpenEditProductItemFilterDrawer = jest.fn()
const mockOpenDeleteProductItemFilterDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenEditProductItemFilterDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteProductItemFilterDialog', () => ({
  useDeleteProductItemFilterDialog: () => ({
    openDeleteProductItemFilterDialog: mockOpenDeleteProductItemFilterDialog,
  }),
}))

jest.mock('../ProductItemFilterDetailsOverview', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../ProductItemFilterActivityLogs', () => ({
  __esModule: true,
  default: () => null,
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

const productItemFilterFixture = {
  __typename: 'ProductItemFilter',
  id: 'pif-1',
  name: 'Region filter',
  code: 'region_filter',
  description: 'Filters by region',
  invoiceDisplayName: 'Region',
  attachedToPlanOrSubscription: false,
  productItem: {
    __typename: 'ProductItem',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
  },
  values: [],
}

const detailsQueryMock = {
  request: { query: GetProductItemFilterForDetailsDocument, variables: { id: 'pif-1' } },
  result: { data: { productItemFilter: productItemFilterFixture } },
}

const ProductItemFilterDetailsWithHeader = () => (
  <>
    <MainHeader />
    <ProductItemFilterDetails />
  </>
)

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderPage = () =>
  rtlRender(<ProductItemFilterDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[detailsQueryMock]}
        useParams={{ productItemFilterId: 'pif-1', tab: 'overview' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductItemFilterDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
    window.history.pushState({}, '', '/')
  })

  it('displays the product item filter name and code in the header once loaded', async () => {
    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent('Region')
    })
    expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
      'region_filter',
    )
  })

  it('renders the catalog breadcrumb link and the static grey product item filter crumb', async () => {
    await act(() => renderPage())

    const catalogCrumb = await screen.findByRole('link', {
      name: 'text_1783019143196z1oi70j03vt',
    })

    expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/product-item-filters')
  })

  it('shows the overview, rate cards, plans and activity logs tabs', async () => {
    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_1783104239825nxqno33u945')).toBeInTheDocument()
    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('shows the activity logs tab when premium and permitted', async () => {
    mockIsPremium = true
    mockHasPermissions.mockReturnValue(true)

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
  })

  it('hides the activity logs tab without premium', async () => {
    mockIsPremium = false

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('hides the activity logs tab without the auditLogsView permission', async () => {
    mockHasPermissions.mockImplementation(
      (permissions: string[]) => !permissions.includes('auditLogsView'),
    )

    await act(() => renderPage())

    expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
    expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
  })

  it('renders the rate cards tab stub content when that tab is active', async () => {
    window.history.pushState({}, '', '/product-catalog/product-item-filters/pif-1/rate-cards')

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByText('text_1783104239825nxqno33u945')).toHaveLength(2)
    })
  })

  it('renders the plans tab stub content when that tab is active', async () => {
    window.history.pushState({}, '', '/product-catalog/product-item-filters/pif-1/plans')

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByText('text_62442e40cea25600b0b6d85a')).toHaveLength(2)
    })
  })

  it('opens the edit drawer with the loaded item filter from the actions dropdown', async () => {
    await act(() => renderPage())

    await userEvent.click(
      (await screen.findAllByTestId(PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID))[0],
    )
    await userEvent.click(screen.getByTestId(PRODUCT_ITEM_FILTER_DETAILS_EDIT_TEST_ID))

    expect(mockOpenEditProductItemFilterDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        productItemFilter: expect.objectContaining({ id: 'pif-1', code: 'region_filter' }),
      }),
    )
  })

  it('opens the delete dialog whose callback navigates back to the product item filters list', async () => {
    await act(() => renderPage())

    await userEvent.click(
      (await screen.findAllByTestId(PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID))[0],
    )
    await userEvent.click(screen.getByTestId(PRODUCT_ITEM_FILTER_DETAILS_DELETE_TEST_ID))

    expect(mockOpenDeleteProductItemFilterDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        productItemFilter: expect.objectContaining({ id: 'pif-1' }),
      }),
    )

    const { callback } = mockOpenDeleteProductItemFilterDialog.mock.calls[0][0]

    callback()

    expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/product-item-filters')
  })

  it('hides the whole actions dropdown without the update and delete permissions', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderPage())

    await waitFor(() => {
      expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent('Region')
    })
    expect(
      screen.queryByTestId(PRODUCT_ITEM_FILTER_DETAILS_ACTIONS_TEST_ID),
    ).not.toBeInTheDocument()
  })

  it('redirects to the product item filters list when the item filter is not found', async () => {
    const notFoundMock = {
      request: { query: GetProductItemFilterForDetailsDocument, variables: { id: 'pif-1' } },
      result: {
        errors: [
          {
            message: 'Resource not found',
            extensions: { code: 'not_found' },
          },
        ],
      },
    }

    await act(() =>
      rtlRender(<ProductItemFilterDetailsWithHeader />, {
        wrapper: ({ children }) => (
          <AllTheProviders
            forceTypenames
            mocks={[notFoundMock]}
            useParams={{ productItemFilterId: 'pif-1', tab: 'overview' }}
          >
            {children}
          </AllTheProviders>
        ),
      }),
    )

    await waitFor(() => {
      expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/product-item-filters', {
        replace: true,
      })
    })
  })
})
