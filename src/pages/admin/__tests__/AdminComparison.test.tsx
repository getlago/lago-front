import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { AdminFeatureTypeEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import AdminComparison from '../AdminComparison'

const mockToggle = jest.fn()
const mockRefetch = jest.fn()
const integration = Object.values(PremiumIntegrationTypeEnum)[0]
const mockOrganizations = [
  { id: 'one', name: 'First org', premiumIntegrations: [integration], featureFlags: [] },
  { id: 'two', name: 'Second org', premiumIntegrations: [], featureFlags: [] },
]

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAdminOrganizationsComparisonQuery: () => ({
    data: { adminOrganizations: { collection: mockOrganizations } },
    loading: false,
    refetch: mockRefetch,
  }),
  useAdminToggleFeatureComparisonMutation: () => [mockToggle],
}))

describe('AdminComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/admin/compare?orgs=one,two')
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    mockToggle.mockResolvedValue({ data: { adminToggleFeature: { id: 'change' } } })
  })

  afterEach(() => jest.restoreAllMocks())

  it.each([
    ['ON', false, 'one'],
    ['OFF', true, 'two'],
  ] as const)('sends the explicit desired state when clicking %s', async (label, enabled, id) => {
    render(<AdminComparison />)
    const row = screen.getByText(integration).closest('tr')

    if (!row) throw new Error('Feature row is missing')

    fireEvent.click(within(row).getByText(label))
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    await act(() => props.onConfirm('Approved for customer', true))

    expect(mockToggle).toHaveBeenCalledWith({
      variables: {
        input: {
          organizationId: id,
          featureType: AdminFeatureTypeEnum.PremiumIntegration,
          featureKey: integration,
          enabled,
          reason: 'Approved for customer',
          notifyOrgAdmin: true,
        },
      },
    })
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state until two organizations are selected', () => {
    window.history.replaceState({}, '', '/admin/compare?orgs=one')
    render(<AdminComparison />)
    expect(screen.getByText('Select at least 2 organizations to compare')).toBeInTheDocument()
  })

  it('lets the operator show matching features as well as differences', async () => {
    render(<AdminComparison />)
    const secondIntegration = Object.values(PremiumIntegrationTypeEnum)[1]

    expect(screen.queryByText(secondIntegration)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Show differences only'))
    await waitFor(() => expect(screen.getByText(secondIntegration)).toBeInTheDocument())
  })
})
