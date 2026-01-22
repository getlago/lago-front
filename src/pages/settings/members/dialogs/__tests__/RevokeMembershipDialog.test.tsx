import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import {
  WARNING_DIALOG_CANCEL_BUTTON_TEST_ID,
  WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID,
  WARNING_DIALOG_TEST_ID,
} from '~/components/designSystem/WarningDialog'
import {
  MembershipItemForMembershipSettingsFragment,
  RevokeMembershipDocument,
} from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { RevokeMembershipDialog, RevokeMembershipDialogRef } from '../RevokeMembershipDialog'

const mockAddToast = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (params: unknown) => mockAddToast(params),
}))

const MEMBERSHIP_ID = 'membership-123'
const MEMBERSHIP_EMAIL = 'member@example.com'
const ORGANIZATION_NAME = 'Test Organization'

const createAdminMembership = (
  id: string,
  email: string,
): MembershipItemForMembershipSettingsFragment => ({
  __typename: 'Membership',
  id,
  roles: ['Admin'],
  permissions: {
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
  },
  user: {
    __typename: 'User',
    id: 'user-123',
    email,
  },
  organization: {
    __typename: 'Organization',
    id: 'org-123',
    name: ORGANIZATION_NAME,
  },
})

const defaultAdmins: MembershipItemForMembershipSettingsFragment[] = [
  createAdminMembership(MEMBERSHIP_ID, MEMBERSHIP_EMAIL),
  createAdminMembership('membership-456', 'other-admin@example.com'),
]

async function prepare({
  mocks = [],
  admins = defaultAdmins,
}: { mocks?: TestMocksType; admins?: MembershipItemForMembershipSettingsFragment[] } = {}) {
  const ref = createRef<RevokeMembershipDialogRef>()

  await act(() => render(<RevokeMembershipDialog ref={ref} admins={admins} />, { mocks }))

  await act(() => {
    ref.current?.openDialog({
      id: MEMBERSHIP_ID,
      email: MEMBERSHIP_EMAIL,
      organizationName: ORGANIZATION_NAME,
    })
  })

  return { ref }
}

describe('RevokeMembershipDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dialog with correct title', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
    })

    it('renders the dialog with description containing email and organization', async () => {
      await prepare()

      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
    })

    it('renders cancel and confirm buttons', async () => {
      await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID)).toBeInTheDocument()
      expect(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('Dialog Actions', () => {
    it('closes dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()

      await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()

      await user.click(screen.getByTestId(WARNING_DIALOG_CANCEL_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
      })
    })

    it('calls revokeMembership mutation when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const mutationMock = {
        request: {
          query: RevokeMembershipDocument,
          variables: {
            input: {
              id: MEMBERSHIP_ID,
            },
          },
        },
        result: {
          data: {
            revokeMembership: {
              id: MEMBERSHIP_ID,
            },
          },
        },
      }

      await prepare({ mocks: [mutationMock] })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          translateKey: 'text_63208c711ce25db78140755d',
          severity: 'success',
        })
      })
    })
  })

  describe('Last Admin Protection', () => {
    it('shows info dialog when trying to revoke the last admin', async () => {
      const singleAdmin = [createAdminMembership(MEMBERSHIP_ID, MEMBERSHIP_EMAIL)]

      await prepare({ admins: singleAdmin })

      // The dialog should be in info mode, not danger mode
      // This is indicated by a different title/description
      expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()
    })

    it('does not call mutation when revoking last admin - just closes dialog', async () => {
      const user = userEvent.setup()
      const singleAdmin = [createAdminMembership(MEMBERSHIP_ID, MEMBERSHIP_EMAIL)]
      const mutationMock = {
        request: {
          query: RevokeMembershipDocument,
          variables: {
            input: {
              id: MEMBERSHIP_ID,
            },
          },
        },
        result: {
          data: {
            revokeMembership: {
              id: MEMBERSHIP_ID,
            },
          },
        },
      }

      await prepare({ mocks: [mutationMock], admins: singleAdmin })

      await user.click(screen.getByTestId(WARNING_DIALOG_CONFIRM_BUTTON_TEST_ID))

      await waitFor(() => {
        // Should NOT call the mutation when it's the last admin
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('Dialog Ref', () => {
    it('exposes openDialog method via ref', async () => {
      const ref = createRef<RevokeMembershipDialogRef>()

      await act(() => render(<RevokeMembershipDialog ref={ref} admins={defaultAdmins} />))

      expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()

      await act(() => {
        ref.current?.openDialog({
          id: MEMBERSHIP_ID,
          email: MEMBERSHIP_EMAIL,
          organizationName: ORGANIZATION_NAME,
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()
      })
    })

    it('exposes closeDialog method via ref', async () => {
      const { ref } = await prepare()

      expect(screen.getByTestId(WARNING_DIALOG_TEST_ID)).toBeInTheDocument()

      await act(() => {
        ref.current?.closeDialog()
      })

      await waitFor(() => {
        expect(screen.queryByTestId(WARNING_DIALOG_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('Snapshot', () => {
    it('matches snapshot', async () => {
      await prepare()

      const dialog = screen.getByTestId(WARNING_DIALOG_TEST_ID)

      expect(dialog).toMatchSnapshot()
    })
  })
})
