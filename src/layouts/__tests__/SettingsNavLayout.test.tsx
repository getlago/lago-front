import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetBillingEntitiesDocument } from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'
import { render } from '~/test-utils'

import SettingsNavLayout, { SETTINGS_NAV_BACK_BUTTON_TEST_ID } from '../SettingsNavLayout'

const mockPermissions = new Set<keyof TMembershipPermissions>()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: (permissions: Array<keyof TMembershipPermissions>) =>
      permissions.every((permission) => mockPermissions.has(permission)),
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { canCreateBillingEntity: false } }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: jest.fn() }),
}))

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: jest.fn() }),
}))

const renderSettings = () =>
  render(<SettingsNavLayout />, {
    useParams: { organizationSlug: 'acme' },
    mocks: [
      {
        request: { query: GetBillingEntitiesDocument, variables: {} },
        result: { data: { billingEntities: { collection: [] } } },
      },
    ],
  })

describe('SettingsNavLayout', () => {
  const originalScrollTo = HTMLElement.prototype.scrollTo

  beforeAll(() => {
    HTMLElement.prototype.scrollTo = jest.fn()
  })

  afterAll(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo
  })

  beforeEach(() => {
    mockPermissions.clear()
    window.history.replaceState({}, '', '/acme/settings/general')
  })

  it('renders the settings navigation without links for restricted sections', () => {
    renderSettings()

    expect(screen.getByTestId(SETTINGS_NAV_BACK_BUTTON_TEST_ID)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it.each<{ permission: keyof TMembershipPermissions; name: string; path: string }>([
    { permission: 'organizationView', name: 'General', path: '/settings/general' },
    {
      permission: 'organizationIntegrationsView',
      name: 'Integrations',
      path: '/settings/integrations/lago',
    },
    {
      permission: 'organizationInvoicesView',
      name: 'Invoices',
      path: '/settings/invoice-sections',
    },
    {
      permission: 'dunningCampaignsView',
      name: 'Dunning',
      path: '/settings/dunnings',
    },
    { permission: 'organizationTaxesView', name: 'Taxes', path: '/settings/taxes' },
  ])('shows only $name when $permission is granted', ({ permission, name, path }) => {
    mockPermissions.add(permission)
    renderSettings()

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', `/acme${path}`)
  })

  it.each<keyof TMembershipPermissions>([
    'organizationMembersView',
    'rolesView',
    'authenticationMethodsView',
    'securityLogsView',
  ])('shows Team & Security with only %s access', (permission) => {
    mockPermissions.add(permission)
    renderSettings()

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Team & Security' })).toHaveAttribute(
      'href',
      '/acme/settings/team-and-security',
    )
  })

  it('navigates to taxes in the organization from the URL', async () => {
    mockPermissions.add('organizationTaxesView')
    renderSettings()

    await userEvent.click(screen.getByRole('link', { name: 'Taxes' }))

    expect(window.location.pathname).toBe('/acme/settings/taxes')
  })
})
