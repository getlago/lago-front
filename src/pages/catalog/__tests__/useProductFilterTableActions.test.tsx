import { renderHook } from '@testing-library/react'

import { ActionItem } from '~/components/designSystem/Table/types'
import { ProductFilterForListFragment } from '~/generated/graphql'

import { useProductFilterTableActions } from '../useProductFilterTableActions'

const mockHasPermissions = jest.fn()
const mockOpenProductFilterDrawer = jest.fn()
const mockOpenDeleteProductFilterDialog = jest.fn()

jest.mock('../drawers/productFilter/useProductFilterDrawer', () => ({
  useProductFilterDrawer: () => ({ openDrawer: mockOpenProductFilterDrawer }),
}))

jest.mock('../dialogs/useDeleteProductFilterDialog', () => ({
  useDeleteProductFilterDialog: () => ({
    openDeleteProductFilterDialog: mockOpenDeleteProductFilterDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const buildProductFilter = (
  overrides: Partial<ProductFilterForListFragment> = {},
): ProductFilterForListFragment => ({
  __typename: 'ProductFilter',
  id: 'pitem-filter-1',
  name: 'Premium seats',
  code: 'premium_seats',
  invoiceDisplayName: 'Premium seats filter',
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    invoiceDisplayName: 'Seat charge',
    code: 'seats',
  },
  values: [],
  ...overrides,
})

const getActions = (
  actionColumn: ReturnType<typeof useProductFilterTableActions>['actionColumn'],
  productFilter: ProductFilterForListFragment,
) => (actionColumn(productFilter) ?? []) as ActionItem<ProductFilterForListFragment>[]

describe('useProductFilterTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a product filter row', () => {
    describe('WHEN getRowActionLink is called', () => {
      it('THEN returns the details overview path', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductFilterTableActions())

        expect(result.current.getRowActionLink({ id: 'pitem-filter-1' })).toBe(
          '/product-catalog/product-filters/pitem-filter-1/overview',
        )
      })
    })

    describe('WHEN the user has both the update and delete permissions', () => {
      it('THEN offers edit and delete actions wired to the drawer and delete dialog', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductFilterTableActions())
        const productFilter = buildProductFilter()
        const actions = getActions(result.current.actionColumn, productFilter)

        expect(actions).toHaveLength(2)

        const [editAction, deleteAction] = actions

        editAction?.onAction(productFilter)
        expect(mockOpenProductFilterDrawer).toHaveBeenCalledWith({ productFilter })

        deleteAction?.onAction(productFilter)
        expect(mockOpenDeleteProductFilterDialog).toHaveBeenCalledWith({ productFilter })
      })
    })

    describe('WHEN the user lacks the update permission', () => {
      it('THEN drops the edit action but keeps delete', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('productFiltersUpdate'),
        )

        const { result } = renderHook(() => useProductFilterTableActions())
        const actions = getActions(result.current.actionColumn, buildProductFilter())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('trash')
      })
    })

    describe('WHEN the user lacks the delete permission', () => {
      it('THEN drops the delete action but keeps edit', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('productFiltersDelete'),
        )

        const { result } = renderHook(() => useProductFilterTableActions())
        const actions = getActions(result.current.actionColumn, buildProductFilter())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('pen')
      })
    })

    describe('WHEN the user has neither permission', () => {
      it('THEN offers no row actions', () => {
        mockHasPermissions.mockReturnValue(false)

        const { result } = renderHook(() => useProductFilterTableActions())

        expect(getActions(result.current.actionColumn, buildProductFilter())).toHaveLength(0)
      })
    })

    describe('WHEN openDeleteProductFilterDialog is called directly from the hook result', () => {
      it('THEN forwards to the delete dialog opener', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductFilterTableActions())
        const productFilter = buildProductFilter()

        result.current.openDeleteProductFilterDialog({ productFilter })
        expect(mockOpenDeleteProductFilterDialog).toHaveBeenCalledWith({ productFilter })
      })
    })
  })
})
