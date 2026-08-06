import { renderHook } from '@testing-library/react'

import { ActionItem } from '~/components/designSystem/Table/types'
import { ProductItemFilterForListFragment } from '~/generated/graphql'

import { useProductItemFilterTableActions } from '../useProductItemFilterTableActions'

const mockHasPermissions = jest.fn()
const mockOpenProductItemFilterDrawer = jest.fn()
const mockOpenDeleteProductItemFilterDialog = jest.fn()

jest.mock('../drawers/productItemFilter/useProductItemFilterDrawer', () => ({
  useProductItemFilterDrawer: () => ({ openDrawer: mockOpenProductItemFilterDrawer }),
}))

jest.mock('../dialogs/useDeleteProductItemFilterDialog', () => ({
  useDeleteProductItemFilterDialog: () => ({
    openDeleteProductItemFilterDialog: mockOpenDeleteProductItemFilterDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const buildProductItemFilter = (
  overrides: Partial<ProductItemFilterForListFragment> = {},
): ProductItemFilterForListFragment => ({
  __typename: 'ProductItemFilter',
  id: 'pitem-filter-1',
  name: 'Premium seats',
  code: 'premium_seats',
  invoiceDisplayName: 'Premium seats filter',
  createdAt: '2024-01-20T00:00:00Z',
  attachedToPlanOrSubscription: false,
  description: null,
  productItem: {
    __typename: 'ProductItem',
    id: 'pitem-1',
    name: 'Seats',
    invoiceDisplayName: 'Seat charge',
    code: 'seats',
  },
  values: [],
  ...overrides,
})

const getActions = (
  actionColumn: ReturnType<typeof useProductItemFilterTableActions>['actionColumn'],
  productItemFilter: ProductItemFilterForListFragment,
) => (actionColumn(productItemFilter) ?? []) as ActionItem<ProductItemFilterForListFragment>[]

describe('useProductItemFilterTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a product item filter row', () => {
    describe('WHEN getRowActionLink is called', () => {
      it('THEN returns the details overview path', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductItemFilterTableActions())

        expect(result.current.getRowActionLink({ id: 'pitem-filter-1' })).toBe(
          '/product-catalog/product-item-filters/pitem-filter-1/overview',
        )
      })
    })

    describe('WHEN the user has both the update and delete permissions', () => {
      it('THEN offers edit and delete actions wired to the drawer and delete dialog', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductItemFilterTableActions())
        const productItemFilter = buildProductItemFilter()
        const actions = getActions(result.current.actionColumn, productItemFilter)

        expect(actions).toHaveLength(2)

        const [editAction, deleteAction] = actions

        editAction?.onAction(productItemFilter)
        expect(mockOpenProductItemFilterDrawer).toHaveBeenCalledWith({ productItemFilter })

        deleteAction?.onAction(productItemFilter)
        expect(mockOpenDeleteProductItemFilterDialog).toHaveBeenCalledWith({ productItemFilter })
      })
    })

    describe('WHEN the user lacks the update permission', () => {
      it('THEN drops the edit action but keeps delete', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('productItemFiltersUpdate'),
        )

        const { result } = renderHook(() => useProductItemFilterTableActions())
        const actions = getActions(result.current.actionColumn, buildProductItemFilter())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('trash')
      })
    })

    describe('WHEN the user lacks the delete permission', () => {
      it('THEN drops the delete action but keeps edit', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('productItemFiltersDelete'),
        )

        const { result } = renderHook(() => useProductItemFilterTableActions())
        const actions = getActions(result.current.actionColumn, buildProductItemFilter())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('pen')
      })
    })

    describe('WHEN the user has neither permission', () => {
      it('THEN offers no row actions', () => {
        mockHasPermissions.mockReturnValue(false)

        const { result } = renderHook(() => useProductItemFilterTableActions())

        expect(getActions(result.current.actionColumn, buildProductItemFilter())).toHaveLength(0)
      })
    })

    describe('WHEN openDeleteProductItemFilterDialog is called directly from the hook result', () => {
      it('THEN forwards to the delete dialog opener', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useProductItemFilterTableActions())
        const productItemFilter = buildProductItemFilter()

        result.current.openDeleteProductItemFilterDialog({ productItemFilter })
        expect(mockOpenDeleteProductItemFilterDialog).toHaveBeenCalledWith({ productItemFilter })
      })
    })
  })
})
