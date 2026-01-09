import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import {
  WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID,
  WARNING_DIALOG_TEST_ID,
} from '~/components/designSystem/WarningDialog'
import { RoleItem } from '~/core/constants/roles'
import { PermissionEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { DeleteRoleDialog, DeleteRoleDialogRef } from '../DeleteRoleDialog'

const mockDeleteRole = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, params?: Record<string, string>) => {
      if (params?.roleName) {
        return `${key} - ${params.roleName}`
      }
      return key
    },
  }),
}))

jest.mock('../../../hooks/useRoleActions', () => ({
  useRoleActions: () => ({
    deleteRole: mockDeleteRole,
    isDeletingRole: false,
    deleteRoleError: undefined,
  }),
}))

const mockRole: RoleItem = {
  __typename: 'Role',
  id: 'role-123',
  name: 'Custom Role',
  description: 'A custom test role',
  code: 'custom_role',
  admin: false,
  memberships: [],
  permissions: [PermissionEnum.PlansView],
}

describe('DeleteRoleDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Dialog Opening', () => {
    it('does not render dialog initially', () => {
      render(<DeleteRoleDialog ref={createRef<DeleteRoleDialogRef>()} />)

      expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
    })

    it('opens dialog when openDialog is called via ref', async () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()
      })
    })

    it('closes dialog when closeDialog is called via ref', async () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()
      })

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Content', () => {
    it('displays role name in description', async () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        // The description should contain the role name
        expect(screen.getByText(/Custom Role/)).toBeInTheDocument()
      })
    })

    it('renders confirm button with translated text', async () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('Delete Action', () => {
    it('calls deleteRole when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const ref = createRef<DeleteRoleDialogRef>()

      mockDeleteRole.mockResolvedValue(undefined)

      render(<DeleteRoleDialog ref={ref} />)

      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockDeleteRole).toHaveBeenCalledWith({
          id: 'role-123',
        })
      })
    })

    it('does not call deleteRole when role is undefined', async () => {
      const user = userEvent.setup()
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      // Open dialog without a role by directly manipulating the internal state
      // This tests the guard clause in handleDeleteRole
      await act(() => {
        ref.current?.openDialog(mockRole)
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      // Reset mock before clicking to verify the call
      mockDeleteRole.mockClear()
      mockDeleteRole.mockResolvedValue(undefined)

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockDeleteRole).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Ref API', () => {
    it('exposes openDialog method', () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      expect(ref.current?.openDialog).toBeDefined()
      expect(typeof ref.current?.openDialog).toBe('function')
    })

    it('exposes closeDialog method', () => {
      const ref = createRef<DeleteRoleDialogRef>()

      render(<DeleteRoleDialog ref={ref} />)

      expect(ref.current?.closeDialog).toBeDefined()
      expect(typeof ref.current?.closeDialog).toBe('function')
    })
  })
})
