import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { GetRolesListDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { EditMemberRoleDialog, EditMemberRoleDialogRef } from '../EditMemberRoleDialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn()

const MEMBER_ID = 'member-123'
const MEMBER_EMAIL = 'member@example.com'

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

async function prepare({ mocks = [rolesListMock] }: { mocks?: TestMocksType } = {}) {
  const ref = createRef<EditMemberRoleDialogRef>()

  await act(() => render(<EditMemberRoleDialog ref={ref} />, { mocks }))

  await act(() => {
    ref.current?.openDialog({
      member: {
        __typename: 'Membership',
        id: MEMBER_ID,
        roles: ['Admin'],
        user: {
          __typename: 'User',
          id: 'user-123',
          email: MEMBER_EMAIL,
        },
        permissions: {
          __typename: 'Permissions',
          aiConversationsView: true,
          aiConversationsCreate: true,
          addonsCreate: true,
          addonsDelete: true,
          addonsUpdate: true,
          addonsView: true,
          analyticsView: true,
          analyticsOverdueBalancesView: true,
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
          billingEntitiesInvoicesView: true,
          billingEntitiesInvoicesUpdate: true,
          billingEntitiesTaxesView: true,
          billingEntitiesTaxesUpdate: true,
          billingEntitiesEmailsView: true,
          billingEntitiesEmailsUpdate: true,
          billingEntitiesDunningCampaignsUpdate: true,
          couponsAttach: true,
          couponsCreate: true,
          couponsDelete: true,
          couponsDetach: true,
          couponsUpdate: true,
          couponsView: true,
          creditNotesCreate: true,
          creditNotesView: true,
          creditNotesVoid: true,
          customersCreate: true,
          customersDelete: true,
          customersUpdate: true,
          customersView: true,
          dataApiView: true,
          developersKeysManage: true,
          developersManage: true,
          draftInvoicesUpdate: true,
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
          permissionsView: true,
          subscriptionsCreate: true,
          subscriptionsUpdate: true,
          subscriptionsView: true,
          walletsCreate: true,
          walletsTerminate: true,
          walletsTopUp: true,
          walletsUpdate: true,
        },
      },
      isEditingLastAdmin: false,
      isEditingMyOwnMembership: false,
    })
  })

  return { ref }
}

describe('EditMemberRoleDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })

    it('renders the member email', async () => {
      await prepare()

      expect(screen.getByText(MEMBER_EMAIL)).toBeInTheDocument()
    })

    it('renders the role picker', async () => {
      await prepare()

      // Check that Role label text exists
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('renders cancel and submit buttons', async () => {
      await prepare()

      const buttons = screen.getAllByRole('button')

      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      // Find the cancel button by text content
      const cancelButton = screen.getAllByRole('button').find((btn) => btn.textContent === 'Cancel')

      if (cancelButton) {
        await user.click(cancelButton)
      }

      await waitFor(
        () => {
          expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
        },
        { timeout: 3000 },
      )
    })
  })

  describe('Last Admin Warning', () => {
    it('shows alert when editing the last admin', async () => {
      const ref = createRef<EditMemberRoleDialogRef>()

      await act(() => render(<EditMemberRoleDialog ref={ref} />, { mocks: [rolesListMock] }))

      await act(() => {
        ref.current?.openDialog({
          member: {
            __typename: 'Membership',
            id: MEMBER_ID,
            roles: ['Admin'],
            user: {
              __typename: 'User',
              id: 'user-123',
              email: MEMBER_EMAIL,
            },
            permissions: {
              __typename: 'Permissions',
              aiConversationsView: true,
              aiConversationsCreate: true,
              addonsCreate: true,
              addonsDelete: true,
              addonsUpdate: true,
              addonsView: true,
              analyticsView: true,
              analyticsOverdueBalancesView: true,
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
              billingEntitiesInvoicesView: true,
              billingEntitiesInvoicesUpdate: true,
              billingEntitiesTaxesView: true,
              billingEntitiesTaxesUpdate: true,
              billingEntitiesEmailsView: true,
              billingEntitiesEmailsUpdate: true,
              billingEntitiesDunningCampaignsUpdate: true,
              couponsAttach: true,
              couponsCreate: true,
              couponsDelete: true,
              couponsDetach: true,
              couponsUpdate: true,
              couponsView: true,
              creditNotesCreate: true,
              creditNotesView: true,
              creditNotesVoid: true,
              customersCreate: true,
              customersDelete: true,
              customersUpdate: true,
              customersView: true,
              dataApiView: true,
              developersKeysManage: true,
              developersManage: true,
              draftInvoicesUpdate: true,
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
              permissionsView: true,
              subscriptionsCreate: true,
              subscriptionsUpdate: true,
              subscriptionsView: true,
              walletsCreate: true,
              walletsTerminate: true,
              walletsTopUp: true,
              walletsUpdate: true,
            },
          },
          isEditingLastAdmin: true,
          isEditingMyOwnMembership: false,
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('alert-type-danger')).toBeInTheDocument()
      })
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<EditMemberRoleDialogRef>()

      await act(() => render(<EditMemberRoleDialog ref={ref} />, { mocks: [rolesListMock] }))

      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog({
          member: {
            __typename: 'Membership',
            id: MEMBER_ID,
            roles: ['Admin'],
            user: {
              __typename: 'User',
              id: 'user-123',
              email: MEMBER_EMAIL,
            },
            permissions: {
              __typename: 'Permissions',
              aiConversationsView: true,
              aiConversationsCreate: true,
              addonsCreate: true,
              addonsDelete: true,
              addonsUpdate: true,
              addonsView: true,
              analyticsView: true,
              analyticsOverdueBalancesView: true,
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
              billingEntitiesInvoicesView: true,
              billingEntitiesInvoicesUpdate: true,
              billingEntitiesTaxesView: true,
              billingEntitiesTaxesUpdate: true,
              billingEntitiesEmailsView: true,
              billingEntitiesEmailsUpdate: true,
              billingEntitiesDunningCampaignsUpdate: true,
              couponsAttach: true,
              couponsCreate: true,
              couponsDelete: true,
              couponsDetach: true,
              couponsUpdate: true,
              couponsView: true,
              creditNotesCreate: true,
              creditNotesView: true,
              creditNotesVoid: true,
              customersCreate: true,
              customersDelete: true,
              customersUpdate: true,
              customersView: true,
              dataApiView: true,
              developersKeysManage: true,
              developersManage: true,
              draftInvoicesUpdate: true,
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
              permissionsView: true,
              subscriptionsCreate: true,
              subscriptionsUpdate: true,
              subscriptionsView: true,
              walletsCreate: true,
              walletsTerminate: true,
              walletsTopUp: true,
              walletsUpdate: true,
            },
          },
          isEditingLastAdmin: false,
          isEditingMyOwnMembership: false,
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })
    })

    it('exposes closeDialog method via ref', async () => {
      const { ref } = await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument()
      })
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      })

      const dialog = screen.getByRole('dialog')

      expect(dialog).toMatchSnapshot()
    })
  })
})
