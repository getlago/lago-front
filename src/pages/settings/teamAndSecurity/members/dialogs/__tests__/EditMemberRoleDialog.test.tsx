import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  DIALOG_TITLE_TEST_ID,
  FORM_DIALOG_CANCEL_BUTTON_TEST_ID,
  FORM_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { MemberForEditRoleForDialogFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import { EDIT_MEMBER_ROLE_FORM_ID, useEditMemberRoleDialog } from '../EditMemberRoleDialog'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

// Mock @tanstack/react-virtual for ComboBox virtualization in jsdom
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        key: index,
        index,
        start: index * 56,
        size: 56,
      })),
    getTotalSize: () => count * 56,
    scrollToIndex: () => {},
    measureElement: () => {},
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/useRolesList', () => ({
  useRolesList: () => ({
    roles: [
      {
        id: 'role-1',
        name: 'Admin',
        code: 'admin',
        description: 'Administrator role',
        permissions: [],
        admin: true,
        memberships: [],
      },
      {
        id: 'role-2',
        name: 'Finance',
        code: 'finance',
        description: 'Finance role',
        permissions: [],
        admin: false,
        memberships: [],
      },
      {
        id: 'role-3',
        name: 'Manager',
        code: 'manager',
        description: 'Manager role',
        permissions: [],
        admin: false,
        memberships: [],
      },
    ],
    isLoadingRoles: false,
  }),
}))

const mockUpdateMembershipRole = jest.fn()

jest.mock('../../hooks/useMembershipActions', () => ({
  useMembershipActions: () => ({
    updateMembershipRole: mockUpdateMembershipRole,
  }),
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

const MEMBER_ID = 'member-123'
const MEMBER_EMAIL = 'member@example.com'

const permissions: MemberForEditRoleForDialogFragment['permissions'] = {
  __typename: 'Permissions',
  aiConversationsView: true,
  aiConversationsCreate: true,
  addonsCreate: true,
  addonsDelete: true,
  addonsUpdate: true,
  addonsView: true,
  analyticsView: true,
  auditLogsView: true,
  authenticationMethodsView: true,
  authenticationMethodsUpdate: true,
  billableMetricsCreate: true,
  billableMetricsDelete: true,
  billableMetricsUpdate: true,
  billableMetricsView: true,
  billingEntitiesView: true,
  billingEntitiesCreate: true,
  billingEntitiesUpdate: true,
  billingEntitiesDelete: true,
  couponsAttach: true,
  couponsCreate: true,
  couponsDelete: true,
  couponsDetach: true,
  couponsUpdate: true,
  couponsView: true,
  creditNotesCreate: true,
  creditNotesView: true,
  creditNotesVoid: true,
  creditNotesSend: true,
  customersCreate: true,
  customersDelete: true,
  customersUpdate: true,
  customersView: true,
  dataApiView: true,
  developersKeysManage: true,
  developersManage: true,
  dunningCampaignsCreate: true,
  dunningCampaignsUpdate: true,
  dunningCampaignsView: true,
  featuresCreate: true,
  featuresDelete: true,
  featuresUpdate: true,
  featuresView: true,
  invoiceCustomSectionsCreate: true,
  invoiceCustomSectionsUpdate: true,
  invoicesCreate: true,
  invoicesSend: true,
  invoicesUpdate: true,
  invoicesView: true,
  invoicesVoid: true,
  organizationEmailsUpdate: true,
  organizationEmailsView: true,
  organizationIntegrationsCreate: true,
  organizationIntegrationsDelete: true,
  organizationIntegrationsUpdate: true,
  organizationIntegrationsView: true,
  organizationInvoicesUpdate: true,
  organizationInvoicesView: true,
  organizationMembersCreate: true,
  organizationMembersDelete: true,
  organizationMembersUpdate: true,
  organizationMembersView: true,
  organizationTaxesUpdate: true,
  organizationTaxesView: true,
  organizationUpdate: true,
  organizationView: true,
  paymentsCreate: true,
  paymentsView: true,
  paymentReceiptsSend: true,
  paymentReceiptsView: true,
  plansCreate: true,
  plansDelete: true,
  plansUpdate: true,
  plansView: true,
  pricingUnitsCreate: true,
  pricingUnitsUpdate: true,
  pricingUnitsView: true,
  rolesCreate: true,
  rolesDelete: true,
  rolesUpdate: true,
  rolesView: true,
  subscriptionsCreate: true,
  subscriptionsUpdate: true,
  subscriptionsView: true,
  walletsCreate: true,
  walletsTerminate: true,
  walletsTopUp: true,
  walletsUpdate: true,
}

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const TestComponent = ({
  isEditingLastAdmin = false,
  isEditingMyOwnMembership = false,
}: {
  isEditingLastAdmin?: boolean
  isEditingMyOwnMembership?: boolean
}) => {
  const { openEditMemberRoleDialog } = useEditMemberRoleDialog()

  return (
    <button
      data-test="open-dialog"
      onClick={() =>
        openEditMemberRoleDialog({
          member: {
            __typename: 'Membership',
            id: MEMBER_ID,
            roles: ['Admin'],
            user: {
              __typename: 'User',
              id: 'user-123',
              email: MEMBER_EMAIL,
            },
            permissions,
          },
          isEditingLastAdmin,
          isEditingMyOwnMembership,
        })
      }
    >
      Open Dialog
    </button>
  )
}

async function prepare({
  isEditingLastAdmin = false,
  isEditingMyOwnMembership = false,
}: {
  isEditingLastAdmin?: boolean
  isEditingMyOwnMembership?: boolean
} = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <TestComponent
          isEditingLastAdmin={isEditingLastAdmin}
          isEditingMyOwnMembership={isEditingMyOwnMembership}
        />
      </NiceModalWrapper>,
    ),
  )

  await act(async () => {
    screen.getByTestId('open-dialog').click()
  })

  await waitFor(() => {
    expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
  })
}

describe('EditMemberRoleDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Opening', () => {
    it('opens the dialog when the hook function is called', async () => {
      await act(() =>
        render(
          <NiceModalWrapper>
            <TestComponent />
          </NiceModalWrapper>,
        ),
      )

      expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()

      await act(async () => {
        screen.getByTestId('open-dialog').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })

    it('renders the member email', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText(MEMBER_EMAIL)).toBeInTheDocument()
      })
    })

    it('renders the role picker', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText('Role')).toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    it('has the correct form ID', async () => {
      await prepare()

      expect(document.getElementById(EDIT_MEMBER_ROLE_FORM_ID)).toBeInTheDocument()
    })

    it('renders the cancel button', async () => {
      await prepare()

      expect(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Last Admin Warning', () => {
    it('shows alert when editing the last admin', async () => {
      await prepare({ isEditingLastAdmin: true })

      await waitFor(() => {
        expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
      })
    })

    it('does not show alert when not editing the last admin', async () => {
      await prepare({ isEditingLastAdmin: false })

      expect(screen.queryByTestId('alert-type-danger')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    async function selectRole(user: ReturnType<typeof userEvent.setup>, roleValue: string) {
      const roleInput = screen.getByPlaceholderText(/search and select a role/i)

      await user.click(roleInput)

      await waitFor(() => {
        expect(screen.getByTestId(roleValue)).toBeInTheDocument()
      })

      await user.click(screen.getByTestId(roleValue))
    }

    it('calls updateMembershipRole with correct arguments on successful submission', async () => {
      const user = userEvent.setup()

      mockUpdateMembershipRole.mockResolvedValue({
        data: {
          updateMembership: {
            id: MEMBER_ID,
            roles: ['Finance'],
          },
        },
      })

      await prepare()

      await selectRole(user, 'finance')

      await user.click(screen.getByText(/edit role/i))

      await waitFor(() => {
        expect(mockUpdateMembershipRole).toHaveBeenCalledWith({
          variables: {
            input: {
              roles: ['finance'],
              id: MEMBER_ID,
            },
          },
        })
      })
    })

    it('closes the dialog after successful submission', async () => {
      const user = userEvent.setup()

      mockUpdateMembershipRole.mockResolvedValue({
        data: {
          updateMembership: {
            id: MEMBER_ID,
            roles: ['Finance'],
          },
        },
      })

      await prepare()
      await selectRole(user, 'finance')

      await user.click(screen.getByText(/edit role/i))

      await waitFor(() => {
        expect(screen.queryByTestId(DIALOG_TITLE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('keeps dialog open when submission fails', async () => {
      const user = userEvent.setup()

      mockUpdateMembershipRole.mockResolvedValue({
        data: null,
      })

      await prepare()
      await selectRole(user, 'finance')

      await user.click(screen.getByText(/edit role/i))

      // Dialog should stay open (closeOnError: false)
      await waitFor(() => {
        expect(screen.getByTestId(DIALOG_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
