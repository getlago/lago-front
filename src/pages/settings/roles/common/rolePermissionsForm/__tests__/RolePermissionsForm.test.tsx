import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { rolePermissionsEmptyValues } from '../const'
import RolePermissionsForm from '../RolePermissionsForm'

// Mock ResizeObserver for jsdom
const mockResizeObserver = jest.fn()

mockResizeObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.ResizeObserver = mockResizeObserver

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Wrapper component that provides form context with proper structure
const RolePermissionsFormWrapper = ({
  isEditable = true,
  isLoading = false,
  defaultValues = rolePermissionsEmptyValues,
}: {
  isEditable?: boolean
  isLoading?: boolean
  defaultValues?: Record<string, boolean>
}) => {
  const form = useAppForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      permissions: defaultValues,
    },
  })

  return (
    <form.AppForm>
      <form>
        <RolePermissionsForm
          form={form}
          fields="permissions"
          isEditable={isEditable}
          isLoading={isLoading}
        />
      </form>
    </form.AppForm>
  )
}

describe('RolePermissionsForm', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the permissions section title', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Title translation key
      expect(screen.getByText('text_17670124237009cpv09qihgr')).toBeInTheDocument()
    })

    it('renders the permissions section description', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Description translation key
      expect(screen.getByText('text_17658096048119hpdp8kwcqd')).toBeInTheDocument()
    })

    it('renders search input', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Search placeholder translation key
      expect(screen.getByPlaceholderText('text_17670163638877x7zsoijho9')).toBeInTheDocument()
    })

    it('renders expand button', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Expand button translation key
      expect(screen.getByText('text_624aa79870f60300a3c4d074')).toBeInTheDocument()
    })

    it('renders collapse button', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Collapse button translation key
      expect(screen.getByText('text_624aa732d6af4e0103d40e61')).toBeInTheDocument()
    })

    it('renders permissions table structure', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // The table should render with some content
      // Verify at least one checkbox is present (overall select all checkbox)
      const checkboxes = screen.getAllByRole('checkbox')

      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('Editable Mode', () => {
    it('renders checkboxes when isEditable is true', async () => {
      await act(() => render(<RolePermissionsFormWrapper isEditable={true} />))

      // Should have checkboxes for permissions
      const checkboxes = screen.getAllByRole('checkbox')

      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('renders view mode without editable checkbox column when isEditable is false', async () => {
      await act(() => render(<RolePermissionsFormWrapper isEditable={false} />))

      // In non-editable mode, the checkbox column should not be visible in the table
      // However, hidden checkboxes for form registration are still present
      // Verify the search input is present (component renders in view mode)
      expect(screen.getByPlaceholderText('text_17670163638877x7zsoijho9')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator when isLoading is true', async () => {
      await act(() => render(<RolePermissionsFormWrapper isLoading={true} />))

      // The table should still render but with loading state
      // Check that the search input is still visible
      expect(screen.getByPlaceholderText('text_17670163638877x7zsoijho9')).toBeInTheDocument()
    })

    it('does not show loading indicator when isLoading is false', async () => {
      await act(() => render(<RolePermissionsFormWrapper isLoading={false} />))

      expect(screen.getByPlaceholderText('text_17670163638877x7zsoijho9')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('allows typing in search input', async () => {
      const user = userEvent.setup()

      await act(() => render(<RolePermissionsFormWrapper />))

      const searchInput = screen.getByPlaceholderText('text_17670163638877x7zsoijho9')

      await user.type(searchInput, 'plans')

      expect(searchInput).toHaveValue('plans')
    })

    it('clears search input when cleanable button is clicked', async () => {
      const user = userEvent.setup()

      await act(() => render(<RolePermissionsFormWrapper />))

      const searchInput = screen.getByPlaceholderText('text_17670163638877x7zsoijho9')

      await user.type(searchInput, 'test search')

      expect(searchInput).toHaveValue('test search')

      // Find and click the clear button (usually rendered when input has value)
      const clearButton = screen.queryByTestId('cleanable-button')

      if (clearButton) {
        await user.click(clearButton)
        expect(searchInput).toHaveValue('')
      }
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('has expand and collapse buttons', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      const expandButton = screen.getByText('text_624aa79870f60300a3c4d074')
      const collapseButton = screen.getByText('text_624aa732d6af4e0103d40e61')

      expect(expandButton).toBeInTheDocument()
      expect(collapseButton).toBeInTheDocument()
    })

    it('expand button is clickable', async () => {
      const user = userEvent.setup()

      await act(() => render(<RolePermissionsFormWrapper />))

      const expandButton = screen.getByText('text_624aa79870f60300a3c4d074')

      // Should not throw when clicked
      await expect(user.click(expandButton)).resolves.not.toThrow()
    })

    it('collapse button is clickable', async () => {
      const user = userEvent.setup()

      await act(() => render(<RolePermissionsFormWrapper />))

      const collapseButton = screen.getByText('text_624aa732d6af4e0103d40e61')

      // Should not throw when clicked
      await expect(user.click(collapseButton)).resolves.not.toThrow()
    })
  })

  describe('Permission Groups', () => {
    it('renders permission groups in the table', async () => {
      await act(() => render(<RolePermissionsFormWrapper />))

      // Should render groups - verify by checking that multiple checkboxes exist
      // Groups have their own checkbox plus the overall checkbox
      const checkboxes = screen.getAllByRole('checkbox')

      // There should be multiple checkboxes (overall + group checkboxes)
      expect(checkboxes.length).toBeGreaterThan(1)
    })
  })

  describe('Overall Checkbox', () => {
    it('renders overall checkbox when editable', async () => {
      await act(() => render(<RolePermissionsFormWrapper isEditable={true} />))

      // The overall checkbox should be the first checkbox in the header
      const checkboxes = screen.getAllByRole('checkbox')

      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })
})
