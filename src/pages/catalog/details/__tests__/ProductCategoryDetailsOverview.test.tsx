import { act, render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SHOW_MORE_TEXT_BUTTON_TEST_ID } from '~/components/designSystem/ShowMoreText'
import { GetProductCategoryForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  PRODUCT_OVERVIEW_EDIT_TEST_ID,
  ProductCategoryDetailsOverview,
} from '../ProductCategoryDetailsOverview'

const mockOpenEditProductCategoryDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/pages/catalog/drawers/productCategory/useProductCategoryDrawer', () => ({
  useProductCategoryDrawer: () => ({ openDrawer: mockOpenEditProductCategoryDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
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

const UNBREAKABLE_DESCRIPTION = 'a'.repeat(500)

const overviewQueryMockFactory = (productCategory: Record<string, unknown>) => ({
  request: { query: GetProductCategoryForDetailsOverviewDocument, variables: { id: 'prod-1' } },
  result: { data: { productCategory } },
})

// forceTypenames + __typename in the fixture: the query spreads fragments, and
// the cache only writes fragment fields when it can match the typename.
const renderOverview = (productCategory: Record<string, unknown> = productCategoryFixture) =>
  rtlRender(<ProductCategoryDetailsOverview />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={[overviewQueryMockFactory(productCategory)]}
        useParams={{ productCategoryId: 'prod-1' }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('ProductCategoryDetailsOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('displays the productCategory information values', async () => {
    await act(() => renderOverview())

    expect(await screen.findByText('Object storage')).toBeInTheDocument()
    expect(screen.getByText('object_storage')).toBeInTheDocument()
    expect(screen.getByText('Base storage productCategory')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
  })

  it('hides the description and invoice display name rows when empty', async () => {
    await act(() =>
      renderOverview({ ...productCategoryFixture, description: null, invoiceDisplayName: null }),
    )

    expect(await screen.findByText('Object storage')).toBeInTheDocument()
    // Row labels (translate is mocked to return the key)
    expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
    expect(screen.queryByText('text_65018c8e5c6b626f030bcf26')).not.toBeInTheDocument()
  })

  it('truncates a description longer than the display limit behind a "See more" button', async () => {
    await act(() =>
      renderOverview({ ...productCategoryFixture, description: UNBREAKABLE_DESCRIPTION }),
    )

    await screen.findByText('Object storage')

    expect(screen.queryByText(UNBREAKABLE_DESCRIPTION)).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId(SHOW_MORE_TEXT_BUTTON_TEST_ID))

    expect(screen.getByText(UNBREAKABLE_DESCRIPTION)).toHaveClass('line-break-anywhere')
  })

  it('opens the edit drawer with the loaded productCategory', async () => {
    await act(() => renderOverview())

    await screen.findByText('Object storage')
    await userEvent.click(screen.getByTestId(PRODUCT_OVERVIEW_EDIT_TEST_ID))

    expect(mockOpenEditProductCategoryDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prod-1', code: 'object_storage' }),
    )
  })

  it('hides the edit button without the productCategoriesUpdate permission', async () => {
    mockHasPermissions.mockReturnValue(false)

    await act(() => renderOverview())

    await screen.findByText('Object storage')

    expect(screen.queryByTestId(PRODUCT_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })
})
