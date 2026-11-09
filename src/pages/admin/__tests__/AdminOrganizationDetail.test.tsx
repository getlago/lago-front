import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { addToast } from '~/core/apolloClient'
import {
  AdminFeatureTypeEnum,
  AdminOrganizationQuery,
  FeatureFlagEnum,
  OrganizationEnvironmentEnum,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import AdminOrganizationDetail, {
  ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID,
  ADMIN_ORGANIZATION_DETAIL_ENVIRONMENT_TEST_ID,
  ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID,
  ADMIN_ORGANIZATION_DETAIL_SAVE_BUTTON_TEST_ID,
} from '../AdminOrganizationDetail'

type AdminOrganization = NonNullable<AdminOrganizationQuery['adminOrganization']>

const mockToggle = jest.fn()
const mockNavigate = jest.fn()
const mockRefetch = jest.fn()
const integration = Object.values(PremiumIntegrationTypeEnum)[0]
const flag = Object.values(FeatureFlagEnum)[0]
const mockOrg: AdminOrganization = {
  id: 'org',
  name: 'Acme',
  email: 'owner@example.com',
  createdAt: '2026-01-01T00:00:00Z',
  premiumIntegrations: [integration],
  featureFlags: [flag],
  environment: OrganizationEnvironmentEnum.Production,
  productionOrganization: null,
  sandboxOrganization: null,
}
const PRODUCTION_LINK = { id: 'production-org', name: 'Acme' }
const SANDBOX_LINK = { id: 'sandbox-org', name: 'Acme Sandbox' }
let mockQuery = { data: { adminOrganization: mockOrg }, loading: false, refetch: mockRefetch }

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAdminOrganizationQuery: () => mockQuery,
  useAdminToggleFeatureMutation: () => [mockToggle],
}))
jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))
jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const toggle = (name: string): void => {
  fireEvent.click(screen.getByRole('checkbox', { name }))
}

const renderWithOrganization = (overrides: Partial<AdminOrganization>): void => {
  mockQuery = {
    data: { adminOrganization: { ...mockOrg, ...overrides } },
    loading: false,
    refetch: mockRefetch,
  }
  render(<AdminOrganizationDetail />, {
    useParams: { organizationId: 'org' },
  })
}

describe('AdminOrganizationDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { data: { adminOrganization: mockOrg }, loading: false, refetch: mockRefetch }
    mockToggle.mockResolvedValue({ data: { adminToggleFeature: { id: 'change' } } })
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
  })
  afterEach(() => jest.restoreAllMocks())

  it('resets unsaved changes without sending mutations', async () => {
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })
    expect(screen.getByText('Save changes')).toBeDisabled()
    toggle(integration)
    expect(screen.getByText('Save changes')).toBeEnabled()
    fireEvent.click(screen.getByText('Reset'))
    await waitFor(() => expect(screen.getByText('Save changes')).toBeDisabled())
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('saves explicit enable and disable states for integrations and flags', async () => {
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })
    const newIntegration = Object.values(PremiumIntegrationTypeEnum)[1]
    const newFlag = Object.values(FeatureFlagEnum)[1]

    for (const key of [integration, newIntegration, `flag-${flag}`, `flag-${newFlag}`]) toggle(key)
    fireEvent.click(screen.getByText('Save changes'))
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    await act(() => props.onConfirm('Customer requested upgrade', true))

    expect(mockToggle).toHaveBeenCalledTimes(4)
    for (const [featureKey, enabled, featureType] of [
      [integration, false, AdminFeatureTypeEnum.PremiumIntegration],
      [newIntegration, true, AdminFeatureTypeEnum.PremiumIntegration],
      [flag, false, AdminFeatureTypeEnum.FeatureFlag],
      [newFlag, true, AdminFeatureTypeEnum.FeatureFlag],
    ]) {
      expect(mockToggle).toHaveBeenCalledWith({
        variables: {
          input: {
            organizationId: 'org',
            featureKey,
            enabled,
            featureType,
            reason: 'Customer requested upgrade',
            notifyOrgAdmin: true,
          },
        },
      })
    }
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('reports partial failures and refreshes the actual server state', async () => {
    mockToggle.mockRejectedValueOnce(new Error('Failed'))
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })
    toggle(integration)
    toggle(`flag-${flag}`)
    fireEvent.click(screen.getByText('Save changes'))
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    await act(() => props.onConfirm('Customer requested upgrade', false))
    expect(mockToggle).toHaveBeenCalledTimes(2)
    expect(addToast).toHaveBeenCalledWith({ severity: 'danger', message: '1 of 2 updates failed.' })
    expect(mockRefetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Save changes')).toBeEnabled()
  })
  describe('GIVEN a production organization without a sandbox', () => {
    describe('WHEN the page renders', () => {
      beforeEach(() => {
        renderWithOrganization({
          environment: OrganizationEnvironmentEnum.Production,
          productionOrganization: null,
          sandboxOrganization: null,
        })
      })

      it('THEN should display the production environment', () => {
        expect(screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_ENVIRONMENT_TEST_ID)).toHaveTextContent(
          'Production',
        )
      })

      it.each([
        ['counterpart link', ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID],
        ['managed by production alert', ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID],
      ])('THEN should not display the %s', (_, testId) => {
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })

      it('THEN should keep the switches enabled and the save button rendered', () => {
        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeEnabled()
        expect(
          screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_SAVE_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a production organization linked to a sandbox', () => {
    beforeEach(() => {
      renderWithOrganization({
        environment: OrganizationEnvironmentEnum.Production,
        productionOrganization: null,
        sandboxOrganization: SANDBOX_LINK,
      })
    })

    describe('WHEN the page renders', () => {
      it('THEN should display the sandbox as the counterpart', () => {
        expect(
          screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID),
        ).toHaveTextContent(SANDBOX_LINK.name)
      })

      it('THEN should keep the production editing controls', () => {
        expect(
          screen.queryByTestId(ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID),
        ).not.toBeInTheDocument()
        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeEnabled()
        expect(
          screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_SAVE_BUTTON_TEST_ID),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the counterpart link', () => {
      it('THEN should open the sandbox admin detail without prepending the org slug', () => {
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID))

        expect(mockNavigate).toHaveBeenCalledWith(`/admin/organizations/${SANDBOX_LINK.id}`, {
          skipSlugPrepend: true,
        })
      })
    })
  })

  describe('GIVEN a sandbox organization linked to its production', () => {
    beforeEach(() => {
      renderWithOrganization({
        environment: OrganizationEnvironmentEnum.Sandbox,
        productionOrganization: PRODUCTION_LINK,
        sandboxOrganization: null,
      })
    })

    describe('WHEN the page renders', () => {
      it('THEN should display the sandbox environment', () => {
        expect(screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_ENVIRONMENT_TEST_ID)).toHaveTextContent(
          'Sandbox',
        )
      })

      it('THEN should display the production as the counterpart', () => {
        expect(
          screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID),
        ).toHaveTextContent(PRODUCTION_LINK.name)
      })

      it('THEN should display the managed by production alert', () => {
        expect(
          screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID),
        ).toBeInTheDocument()
      })

      it('THEN should disable every switch', () => {
        const checkboxes = screen.getAllByRole('checkbox')

        expect(checkboxes).not.toHaveLength(0)
        for (const checkbox of checkboxes) expect(checkbox).toBeDisabled()
      })

      it('THEN should not render the save footer', () => {
        expect(
          screen.queryByTestId(ADMIN_ORGANIZATION_DETAIL_SAVE_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking the alert button', () => {
      it('THEN should open the production admin detail without prepending the org slug', () => {
        const alert = screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID)

        fireEvent.click(within(alert).getByRole('button'))

        expect(mockNavigate).toHaveBeenCalledWith(`/admin/organizations/${PRODUCTION_LINK.id}`, {
          skipSlugPrepend: true,
        })
      })
    })

    describe('WHEN clicking the counterpart link', () => {
      it('THEN should open the production admin detail without prepending the org slug', () => {
        fireEvent.click(screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID))

        expect(mockNavigate).toHaveBeenCalledWith(`/admin/organizations/${PRODUCTION_LINK.id}`, {
          skipSlugPrepend: true,
        })
      })
    })
  })

  describe('GIVEN a sandbox organization without a linked production', () => {
    describe('WHEN the page renders', () => {
      it('THEN should display the alert without a button and no counterpart link', () => {
        renderWithOrganization({
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization: null,
          sandboxOrganization: null,
        })

        const alert = screen.getByTestId(ADMIN_ORGANIZATION_DETAIL_MANAGED_BY_PRODUCTION_TEST_ID)

        expect(within(alert).queryByRole('button')).not.toBeInTheDocument()
        expect(
          screen.queryByTestId(ADMIN_ORGANIZATION_DETAIL_COUNTERPART_LINK_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })
  })
})
