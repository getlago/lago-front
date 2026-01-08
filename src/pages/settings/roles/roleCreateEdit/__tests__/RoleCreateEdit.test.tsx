import { act, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import RoleCreateEdit, { ROLE_CREATE_EDIT_FORM_ID, SUBMIT_ROLE_DATA_TEST } from '../RoleCreateEdit'

const mockNavigate = jest.fn()
const mockHandleSave = jest.fn().mockResolvedValue({ errors: [] })

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ search: '' }),
  generatePath: (path: string, params?: Record<string, string>) => {
    if (params) {
      return Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(`:${key}`, value),
        path,
      )
    }
    return path
  },
}))

jest.mock('../useRoleCreateEdit', () => ({
  useRoleCreateEdit: () => ({
    roleId: undefined,
    isEdition: false,
    handleSave: mockHandleSave,
  }),
}))

jest.mock('../../common/useRoleDetails', () => ({
  useRoleDetails: () => ({
    role: undefined,
    isLoadingRole: false,
    canBeEdited: false,
    canBeDeleted: false,
  }),
}))

jest.mock(
  '../../common/rolePermissionsForm/RolePermissionsForm',
  () =>
    function MockRolePermissionsForm() {
      return <div data-test="role-permissions-form">Permissions Form</div>
    },
)

describe('RoleCreateEdit - Create Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

    expect(screen.getByText('text_1765464417018tezju4yvyoo')).toBeInTheDocument()
  })

  it('renders description input field', async () => {
    await act(() => render(<RoleCreateEdit />))

    expect(screen.getByText('text_6388b923e514213fed58331c')).toBeInTheDocument()
  })

  it('renders permissions form', async () => {
    await act(() => render(<RoleCreateEdit />))

    expect(screen.getByTestId('role-permissions-form')).toBeInTheDocument()
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
})
