import { screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductListItemFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import ProductsList from '../ProductsList'

const mockTableProps = jest.fn()
const mockSearchInputProps = jest.fn()
const mockHasPermissions = jest.fn()
const mockGoToPage = jest.fn()
const mockDebouncedSearch = jest.fn()
const mockOpenProductDrawer = jest.fn()
const mockOpenDeleteProductDialog = jest.fn()
const mockUseProductsLazyQuery = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: 1, goToPage: mockGoToPage }),
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: (props: Record<string, unknown>) => {
    mockSearchInputProps(props)
    return null
  },
}))

jest.mock('../drawers/product/useProductDrawer', () => ({
  useProductDrawer: () => ({ openDrawer: mockOpenProductDrawer }),
}))

jest.mock('../dialogs/useDeleteProductDialog', () => ({
  useDeleteProductDialog: () => ({ openDeleteProductDialog: mockOpenDeleteProductDialog }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jun 11, 2024' }),
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: mockDebouncedSearch,
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useProductsLazyQuery: (options: Record<string, unknown>) => mockUseProductsLazyQuery(options),
}))

const defaultQueryState = {
  data: undefined,
  error: undefined,
  loading: false,
  variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
}

const getTableProps = () => mockTableProps.mock.calls[0][0] as TableProps<ProductListItemFragment>

describe('ProductsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseProductsLazyQuery.mockReturnValue([jest.fn(), defaultQueryState])
  })

  it('wires the query with the URL page, default limit and network-only policies', () => {
    render(<ProductsList />)

    expect(mockUseProductsLazyQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { limit: DEFAULT_PAGE_SIZE, page: 1 },
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        nextFetchPolicy: 'network-only',
      }),
    )
  })

  it('renders the three design columns, count and date right-aligned', () => {
    render(<ProductsList />)

    const { columns } = getTableProps()

    expect(columns).toHaveLength(3)
    expect(columns[0]).toEqual(expect.objectContaining({ key: 'name', maxSpace: true }))
    expect(columns[1]).toEqual(
      expect.objectContaining({ key: 'productItemsCount', textAlign: 'right' }),
    )
    expect(columns[2]).toEqual(expect.objectContaining({ key: 'createdAt', textAlign: 'right' }))
  })

  it('displays the invoice display name over the name, with the code below', () => {
    render(<ProductsList />)

    const nameColumn = getTableProps().columns[0]
    const product = {
      id: '1',
      name: 'Object storage',
      invoiceDisplayName: 'Storage (invoiced)',
      code: 'object_storage',
      productItemsCount: 3,
      createdAt: '2024-06-11',
    } as ProductListItemFragment

    render(<>{nameColumn?.content(product)}</>)

    expect(screen.getByText('Storage (invoiced)')).toBeInTheDocument()
    expect(screen.queryByText('Object storage')).not.toBeInTheDocument()
    expect(screen.getByText('object_storage')).toBeInTheDocument()
  })

  it('falls back to the product name when there is no invoice display name', () => {
    render(<ProductsList />)

    const nameColumn = getTableProps().columns[0]
    const product = {
      id: '1',
      name: 'Object storage',
      invoiceDisplayName: null,
      code: 'object_storage',
      productItemsCount: 3,
      createdAt: '2024-06-11',
    } as ProductListItemFragment

    render(<>{nameColumn?.content(product)}</>)

    expect(screen.getByText('Object storage')).toBeInTheDocument()
  })

  it('links each row to the product details overview tab', () => {
    render(<ProductsList />)

    const { onRowActionLink } = getTableProps()

    expect(onRowActionLink?.({ id: 'prod-1' } as ProductListItemFragment)).toBe(
      '/product-catalog/products/prod-1/overview',
    )
  })

  describe('row actions', () => {
    const product = {
      id: 'prod-1',
      name: 'Object storage',
      code: 'object_storage',
    } as ProductListItemFragment

    it('offers edit and delete, wired to the drawer and the delete dialog', () => {
      render(<ProductsList />)

      const { actionColumn, actionColumnTooltip } = getTableProps()
      const actions = (actionColumn?.(product) ?? []) as ActionItem<ProductListItemFragment>[]

      // Tooltip is composed from the permitted action labels, capitalized.
      const tooltip = actionColumnTooltip?.(product) ?? ''

      expect(tooltip.toLowerCase()).toBe(
        'text_629728388c4d2300e2d3816a, text_629728388c4d2300e2d38182',
      )
      expect(actions).toHaveLength(2)

      const [editAction, deleteAction] = actions

      expect(editAction).toEqual(
        expect.objectContaining({ startIcon: 'pen', title: 'text_629728388c4d2300e2d3816a' }),
      )
      editAction?.onAction(product)
      expect(mockOpenProductDrawer).toHaveBeenCalledWith(product)

      expect(deleteAction).toEqual(
        expect.objectContaining({ startIcon: 'trash', title: 'text_629728388c4d2300e2d38182' }),
      )
      deleteAction?.onAction(product)
      expect(mockOpenDeleteProductDialog).toHaveBeenCalledWith({ product })
    })

    it('hides both actions without the update and delete permissions', () => {
      mockHasPermissions.mockReturnValue(false)

      render(<ProductsList />)

      const { actionColumn, actionColumnTooltip } = getTableProps()

      expect(actionColumn?.(product)).toHaveLength(0)
      expect(actionColumnTooltip?.(product)).toBe('')
    })
  })

  it('resets to page 1 before searching', () => {
    render(<ProductsList />)

    const { onChange } = mockSearchInputProps.mock.calls[0][0] as {
      onChange: (value: string) => void
    }

    onChange('storage')

    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockDebouncedSearch).toHaveBeenCalledWith('storage')
    expect(mockGoToPage.mock.invocationCallOrder[0]).toBeLessThan(
      mockDebouncedSearch.mock.invocationCallOrder[0],
    )
  })

  it('offers the create-product CTA in the empty state when allowed', () => {
    render(<ProductsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783622030703gf47xn4zdit')
    expect(placeholder?.emptyState?.buttonTitle).toBe('text_1783622030703h5vhmp73muk')

    placeholder?.emptyState?.buttonAction?.()

    expect(mockOpenProductDrawer).toHaveBeenCalledTimes(1)
  })

  it('hides the create CTA without the productsCreate permission', () => {
    mockHasPermissions.mockReturnValue(false)

    render(<ProductsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783622030703gf47xn4zdit')
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
  })

  it('uses the search variants of the empty and error states while searching', () => {
    mockUseProductsLazyQuery.mockReturnValue([
      jest.fn(),
      { ...defaultQueryState, variables: { ...defaultQueryState.variables, searchTerm: 'foo' } },
    ])

    render(<ProductsList />)

    const { placeholder } = getTableProps()

    expect(placeholder?.emptyState?.title).toBe('text_1783622030703xtzifa6nivi')
    expect(placeholder?.emptyState?.buttonTitle).toBeUndefined()
    expect(placeholder?.errorState?.title).toBe('text_623b53fea66c76017eaebb6e')
    expect(placeholder?.errorState?.buttonTitle).toBeUndefined()
  })
})
