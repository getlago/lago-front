import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetRolesListDocument } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render, TestMocksType } from '~/test-utils'

import { UpdateInviteSingleRole } from '../../common/inviteTypes'
import RolePicker from '../RolePicker'

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

const rolesListMock = {
  request: {
    query: GetRolesListDocument,
  },
  result: {
    data: {
      roles: [
        {
          __typename: 'Role',
          id: 'role-1',
          name: 'Admin',
          code: 'admin',
          description: 'Administrator role',
          permissions: [],
          admin: true,
          memberships: [],
        },
        {
          __typename: 'Role',
          id: 'role-2',
          name: 'Finance',
          code: 'finance',
          description: 'Finance role',
          permissions: [],
          admin: false,
          memberships: [],
        },
        {
          __typename: 'Role',
          id: 'role-3',
          name: 'Manager',
          code: 'manager',
          description: 'Manager role',
          permissions: [],
          admin: false,
          memberships: [],
        },
      ],
    },
  },
}

// Wrapper component that provides form context
const RolePickerWrapper = ({
  onSubmit,
}: {
  onSubmit?: (values: UpdateInviteSingleRole) => void
}) => {
  const form = useAppForm({
    defaultValues: {
      role: '',
    } as UpdateInviteSingleRole,
    onSubmit: async ({ value }) => {
      onSubmit?.(value)
    },
  })

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <RolePicker form={form} fields={{ role: 'role' }} />
        <button type="submit" data-test="submit-button">
          Submit
        </button>
      </form>
    </form.AppForm>
  )
}

async function prepare({ mocks = [rolesListMock] }: { mocks?: TestMocksType } = {}) {
  const onSubmit = jest.fn()

  await act(() =>
    render(<RolePickerWrapper onSubmit={onSubmit} />, {
      mocks,
    }),
  )

  return { onSubmit }
}

describe('RolePicker', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the role label', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument()
      })
    })

    it('renders the combobox input', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    it('renders placeholder text', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search and select a role/i)).toBeInTheDocument()
      })
    })

    it('does not show premium upsell banner for premium users', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument()
      })

      // Premium upsell banner should not be visible for premium users
      expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument()
    })
  })

  describe('Role Selection', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      // Click on the combobox to open the dropdown
      const combobox = screen.getByRole('combobox')

      await user.click(combobox)

      // Dropdown should be expanded
      await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('Loading State', () => {
    it('renders combobox while roles are loading', async () => {
      const loadingMock = {
        request: {
          query: GetRolesListDocument,
        },
        delay: Infinity,
        result: {
          data: null,
        },
      }

      await act(() =>
        render(<RolePickerWrapper />, {
          mocks: [loadingMock],
        }),
      )

      // Combobox should still render
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})
