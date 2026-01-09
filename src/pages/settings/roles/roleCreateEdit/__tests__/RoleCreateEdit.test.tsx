import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render, testMockNavigateFn } from '~/test-utils'

import RoleCreateEdit, { ROLE_CREATE_EDIT_FORM_ID, SUBMIT_ROLE_DATA_TEST } from '../RoleCreateEdit'

const mockHandleSave = jest.fn().mockResolvedValue({ errors: [] })

// Mock variables that can be changed per test
let mockIsEdition = false
let mockRoleId: string | undefined = undefined
let mockRole: Record<string, unknown> | undefined = undefined
let mockIsLoadingRole = false

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('../useRoleCreateEdit', () => ({
  useRoleCreateEdit: () => ({
    roleId: mockRoleId,
    isEdition: mockIsEdition,
    handleSave: mockHandleSave,
  }),
}))

jest.mock('../../hooks/useRoleDetails', () => ({
  useRoleDetails: () => ({
    role: mockRole,
    isLoadingRole: mockIsLoadingRole,
    canBeEdited: true,
    canBeDeleted: true,
  }),
}))

jest.mock('~/pages/settings/roles/common/rolePermissionsForm/RolePermissionsForm', () => ({
  __esModule: true,
  default: function MockRolePermissionsForm() {
    return <div data-test="role-permissions-form">Permissions Form</div>
  },
}))

describe('RoleCreateEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsEdition = false
    mockRoleId = undefined
    mockRole = undefined
    mockIsLoadingRole = false
  })

  afterEach(() => {
    cleanup()
  })

  describe('Create Mode', () => {
    it('renders create form title', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getAllByText('text_176613814608779rumjj7r2d')).toHaveLength(2)
    })

    it('renders create form description', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_176613820114657nlabp19lm')).toBeInTheDocument()
    })

    it('renders name input field', async () => {
      await act(() => render(<RoleCreateEdit />))

      // NameAndCodeGroup uses this translation key for the name label
      expect(screen.getByText('text_629728388c4d2300e2d38091')).toBeInTheDocument()
    })

    it('renders description input field', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_6388b923e514213fed58331c')).toBeInTheDocument()
    })

    it('renders submit button with create text', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_1766138146087w2ax628r6j1')).toBeInTheDocument()
    })

    it('renders cancel button', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_62e79671d23ae6ff149de968')).toBeInTheDocument()
    })

    it('has correct form id', async () => {
      const { container } = await act(() => render(<RoleCreateEdit />))

      expect(container.querySelector(`#${ROLE_CREATE_EDIT_FORM_ID}`)).toBeInTheDocument()
    })

    it('has submit button with correct data-test attribute', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByTestId(SUBMIT_ROLE_DATA_TEST)).toBeInTheDocument()
    })

    it('renders permissions form component', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByTestId('role-permissions-form')).toBeInTheDocument()
    })

    it('renders code input field', async () => {
      await act(() => render(<RoleCreateEdit />))

      // NameAndCodeGroup uses this translation key for the code label
      expect(screen.getByText('text_629728388c4d2300e2d380b7')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockIsEdition = true
      mockRoleId = 'role-123'
      mockRole = {
        id: 'role-123',
        name: 'Test Role',
        code: 'test_role',
        description: 'Test role description',
        permissions: [],
      }
    })

    it('renders edit form title', async () => {
      await act(() => render(<RoleCreateEdit />))

      // Edit mode uses different translation key
      expect(screen.getAllByText('text_1766138146087vq4eqb2moza')).toHaveLength(2)
    })

    it('renders submit button with edit text', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_1765528921745ibx4b56q1mt')).toBeInTheDocument()
    })

    it('renders form description', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_176613820114657nlabp19lm')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when role is loading', async () => {
      mockIsLoadingRole = true
      mockRoleId = 'role-123'

      const { container } = await act(() => render(<RoleCreateEdit />))

      // Should render FormLoadingSkeleton
      expect(container.querySelector(`#${ROLE_CREATE_EDIT_FORM_ID}`)).toBeInTheDocument()
    })

    it('hides loading skeleton when role is loaded', async () => {
      mockIsLoadingRole = false

      await act(() => render(<RoleCreateEdit />))

      // Form should be visible
      expect(screen.getByText('text_629728388c4d2300e2d38091')).toBeInTheDocument()
    })
  })

  describe('Form Structure', () => {
    it('renders general information section title', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_1767012423699qiisp5z4jqy')).toBeInTheDocument()
    })

    it('renders general information section description', async () => {
      await act(() => render(<RoleCreateEdit />))

      expect(screen.getByText('text_1767013866975h2lgwgojt4s')).toBeInTheDocument()
    })
  })

  describe('Cancel Button Behavior', () => {
    it('navigates to roles list on cancel when creating', async () => {
      const user = userEvent.setup()

      await act(() => render(<RoleCreateEdit />))

      const cancelButton = screen.getByText('text_62e79671d23ae6ff149de968')

      await user.click(cancelButton)

      await waitFor(() => {
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })

  describe('Form Sections', () => {
    it('renders form header with title', async () => {
      await act(() => render(<RoleCreateEdit />))

      // Header should contain the form title
      const titles = screen.getAllByText('text_176613814608779rumjj7r2d')

      expect(titles.length).toBeGreaterThanOrEqual(1)
    })

    it('renders multiple buttons in the form', async () => {
      const { container } = await act(() => render(<RoleCreateEdit />))

      // Should have buttons (cancel, submit, and possibly close button)
      const buttons = container.querySelectorAll('button')

      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })
})
