import { renderHook } from '@testing-library/react'
import { RefObject } from 'react'

import { AddCouponToCustomerDialogRef } from '~/components/customers/AddCouponToCustomerDialog'
import { DeleteCustomerDialogRef } from '~/components/customers/DeleteCustomerDialog'
import { MainHeaderDropdownAction, MainHeaderInPageAction } from '~/components/MainHeader/types'
import { CustomerAccountTypeEnum, CustomerDetailsFragment } from '~/generated/graphql'

import { useCustomerDetailsHeaderActions } from '../useCustomerDetailsHeaderActions'

const mockNavigate = jest.fn()
const mockTranslate = jest.fn((key: string) => key)
const mockHasPermissions = jest.fn(() => true)
const mockHandleDownloadFile = jest.fn()
const mockGeneratePortalUrl = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  generatePath: (route: string, params: Record<string, string>) => {
    let result = route

    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value)
    })

    return result
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/useDownloadFile', () => ({
  useDownloadFile: () => ({
    handleDownloadFile: mockHandleDownloadFile,
  }),
}))

jest.mock('~/hooks/useIsCustomerReadyForOverduePayment', () => ({
  useIsCustomerReadyForOverduePayment: () => ({
    isCustomerReadyForOverduePayment: true,
    loading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGenerateCustomerPortalUrlMutation: () => [mockGeneratePortalUrl],
}))

const createMockCustomer = (
  overrides: Partial<CustomerDetailsFragment> = {},
): CustomerDetailsFragment =>
  ({
    id: 'cust-1',
    displayName: 'Test Customer',
    externalId: 'ext-1',
    hasOverdueInvoices: true,
    hasActiveWallet: false,
    accountType: CustomerAccountTypeEnum.Customer,
    ...overrides,
  }) as unknown as CustomerDetailsFragment

const defaultParams = {
  customerId: 'cust-1',
  customer: createMockCustomer(),
  deleteDialogRef: {
    current: { openDialog: jest.fn() },
  } as unknown as RefObject<DeleteCustomerDialogRef>,
  addCouponDialogRef: {
    current: { openDialog: jest.fn() },
  } as unknown as RefObject<AddCouponToCustomerDialogRef>,
}

describe('useCustomerDetailsHeaderActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN the hook is called with a customer', () => {
    describe('WHEN user has all permissions', () => {
      it('THEN should return the portal URL action as first item', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const portalAction = result.current[0]

        expect(portalAction).toMatchObject({
          type: 'action',
          variant: 'inline',
          startIcon: 'outside',
        })
      })

      it('THEN should return a dropdown action as second item', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1]

        expect(dropdownAction).toMatchObject({
          type: 'dropdown',
        })
      })

      it('THEN should include dropdown items for all actions', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction

        // 7 items: overdue, subscription, invoice, coupon, wallet, edit, delete
        expect(dropdownAction.items).toHaveLength(7)
      })
    })

    describe('WHEN user has no permissions', () => {
      it('THEN should only return the portal URL action', () => {
        mockHasPermissions.mockReturnValue(false)

        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        expect(result.current).toHaveLength(1)
        expect(result.current[0]).toMatchObject({ type: 'action' })
      })
    })

    describe('WHEN customer has an active wallet', () => {
      it('THEN should disable the wallet creation item', () => {
        const params = {
          ...defaultParams,
          customer: createMockCustomer({ hasActiveWallet: true }),
        }

        const { result } = renderHook(() => useCustomerDetailsHeaderActions(params))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const walletItem = dropdownAction.items[4]

        expect(walletItem.disabled).toBe(true)
      })
    })

    describe('WHEN customer has no overdue invoices', () => {
      it('THEN should hide the overdue payment item', () => {
        const params = {
          ...defaultParams,
          customer: createMockCustomer({ hasOverdueInvoices: false }),
        }

        const { result } = renderHook(() => useCustomerDetailsHeaderActions(params))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const overdueItem = dropdownAction.items[0]

        expect(overdueItem.hidden).toBe(true)
      })
    })

    describe('WHEN portal URL action is clicked', () => {
      it('THEN should call generatePortalUrl with the customer id', async () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const portalAction = result.current[0] as MainHeaderInPageAction

        await portalAction.onClick()

        expect(mockGeneratePortalUrl).toHaveBeenCalledWith({
          variables: { input: { id: 'cust-1' } },
        })
      })
    })

    describe('WHEN a dropdown item onClick is called', () => {
      it('THEN should navigate to the overdue payment route', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[0].onClick(closePopper)

        expect(mockNavigate).toHaveBeenCalledWith('/customer/cust-1/request-overdue-payment')
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should navigate to the subscription creation route', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[1].onClick(closePopper)

        expect(mockNavigate).toHaveBeenCalledWith('/customer/cust-1/create/subscription')
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should navigate to the invoice creation route', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[2].onClick(closePopper)

        expect(mockNavigate).toHaveBeenCalledWith('/customer/cust-1/create-invoice')
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should navigate to the wallet creation route', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[4].onClick(closePopper)

        expect(mockNavigate).toHaveBeenCalledWith('/customer/cust-1/wallet/create')
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should navigate to the customer edit route', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[5].onClick(closePopper)

        expect(mockNavigate).toHaveBeenCalledWith('/customer/cust-1/edit')
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should navigate to customers list after delete', () => {
        const onDeletedCapture = { fn: jest.fn() as (() => void) | undefined }

        const deleteDialogRef = {
          current: {
            openDialog: jest.fn(({ onDeleted }: { onDeleted: () => void }) => {
              onDeletedCapture.fn = onDeleted
            }),
          },
        } as unknown as RefObject<DeleteCustomerDialogRef>

        const { result } = renderHook(() =>
          useCustomerDetailsHeaderActions({ ...defaultParams, deleteDialogRef }),
        )

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[6].onClick(closePopper)

        // Simulate the onDeleted callback
        onDeletedCapture.fn?.()

        expect(mockNavigate).toHaveBeenCalledWith('/customers')
      })

      it('THEN should open delete dialog and close popper when delete is clicked', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[6].onClick(closePopper)

        expect(
          (defaultParams.deleteDialogRef.current as unknown as { openDialog: jest.Mock })
            .openDialog,
        ).toHaveBeenCalled()
        expect(closePopper).toHaveBeenCalled()
      })

      it('THEN should open add coupon dialog and close popper when coupon is clicked', () => {
        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction
        const closePopper = jest.fn()

        dropdownAction.items[3].onClick(closePopper)

        expect(
          (defaultParams.addCouponDialogRef.current as unknown as { openDialog: jest.Mock })
            .openDialog,
        ).toHaveBeenCalled()
        expect(closePopper).toHaveBeenCalled()
      })
    })

    describe('WHEN specific permissions are missing', () => {
      it('THEN should hide items based on permission checks', () => {
        // Make hasPermissions return false for subscriptionsCreate
        mockHasPermissions.mockImplementation(((perms: string[]) => {
          if (perms.includes('subscriptionsCreate')) return false

          return true
        }) as unknown as () => boolean)

        const { result } = renderHook(() => useCustomerDetailsHeaderActions(defaultParams))

        const dropdownAction = result.current[1] as MainHeaderDropdownAction

        expect(dropdownAction.items[1].hidden).toBe(true)
      })
    })
  })
})
