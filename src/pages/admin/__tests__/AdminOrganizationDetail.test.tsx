import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import { ReasonModalError, ReasonModalProps } from '~/components/admin/ReasonModal'
import { addToast } from '~/core/apolloClient'
import {
  AdminFeatureTypeEnum,
  FeatureFlagEnum,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import AdminOrganizationDetail from '../AdminOrganizationDetail'

const mockToggle = jest.fn()
const mockRename = jest.fn()
const mockRefetch = jest.fn()
const integration = Object.values(PremiumIntegrationTypeEnum)[0]
const flag = Object.values(FeatureFlagEnum)[0]
const mockOrg = {
  id: 'org',
  name: 'Acme',
  email: 'owner@example.com',
  premiumIntegrations: [integration],
  featureFlags: [flag],
}
let mockQuery = { data: { adminOrganization: mockOrg }, loading: false, refetch: mockRefetch }

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useAdminOrganizationQuery: () => mockQuery,
  useAdminRenameOrganizationMutation: () => [mockRename],
  useAdminToggleFeatureMutation: () => [mockToggle],
}))
jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const toggle = (name: string): void => {
  fireEvent.click(screen.getByRole('checkbox', { name }))
}

describe('AdminOrganizationDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery = { data: { adminOrganization: mockOrg }, loading: false, refetch: mockRefetch }
    mockToggle.mockResolvedValue({ data: { adminToggleFeature: { id: 'change' } } })
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
  })
  afterEach(() => jest.restoreAllMocks())

  it('clears a typed name with the Reset button', async () => {
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: 'Acme Inc' } })
    expect(screen.getByText('Reset')).toBeEnabled()

    fireEvent.click(screen.getByText('Reset'))

    await waitFor(() => expect(screen.getByDisplayValue('Acme')).toBeInTheDocument())
    expect(screen.getByText('Save changes')).toBeDisabled()
  })

  it('explains why a rename was rejected', async () => {
    mockRename.mockResolvedValue({
      data: { adminRenameOrganization: null },
      errors: [
        {
          message: 'unprocessable_entity',
          extensions: { code: 'unprocessable_entity', details: { reason: ['value_is_too_long'] } },
        },
      ],
    })
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: 'Acme Inc' } })
    fireEvent.click(screen.getByText('Save changes'))

    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    await expect(props.onConfirm('Customer rebranded their company', false)).rejects.toThrow(
      'The reason is too long',
    )
  })

  it('adds no message for errors the global error link already reported', async () => {
    mockRename.mockResolvedValue({
      data: { adminRenameOrganization: null },
      errors: [{ message: 'internal_error', extensions: { code: 'internal_error' } }],
    })
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: 'Acme Inc' } })
    toggle(integration)
    fireEvent.click(screen.getByText('Save changes'))

    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    const confirmation = props.onConfirm('Customer rebranded their company', false)

    await expect(confirmation).rejects.toBeInstanceOf(ReasonModalError)
    await expect(confirmation).rejects.toHaveProperty('message', '')
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('keeps Save disabled until the name actually changes', () => {
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    expect(screen.getByText('Save changes')).toBeDisabled()
    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: '   ' } })
    expect(screen.getByText('Save changes')).toBeDisabled()
  })

  it('renames the organization after a reason is provided', async () => {
    mockRename.mockResolvedValue({ data: { adminRenameOrganization: { id: 'log' } } })
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: '  Acme Inc  ' } })
    fireEvent.click(screen.getByText('Save changes'))

    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    expect(props.title).toBe('Rename organization')
    expect(props.showNotifyCheckbox).toBe(false)
    await act(() => props.onConfirm('Customer rebranded their company', false))

    expect(mockRename).toHaveBeenCalledWith({
      variables: {
        input: {
          organizationId: 'org',
          name: 'Acme Inc',
          reason: 'Customer rebranded their company',
        },
      },
    })
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('saves a rename and feature changes with one reason', async () => {
    mockRename.mockResolvedValue({ data: { adminRenameOrganization: { id: 'log' } } })
    render(<AdminOrganizationDetail />, {
      useParams: { organizationId: 'org' },
    })

    fireEvent.change(screen.getByDisplayValue('Acme'), { target: { value: 'Acme Inc' } })
    toggle(integration)
    fireEvent.click(screen.getByText('Save changes'))

    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    expect(props.title).toBe('Rename organization and update 1 feature')
    expect(props.showNotifyCheckbox).toBe(true)
    await act(() => props.onConfirm('Customer rebranded their company', true))

    expect(mockRename).toHaveBeenCalledTimes(1)
    expect(mockToggle).toHaveBeenCalledWith({
      variables: {
        input: {
          organizationId: 'org',
          featureKey: integration,
          enabled: false,
          featureType: AdminFeatureTypeEnum.PremiumIntegration,
          reason: 'Customer rebranded their company',
          notifyOrgAdmin: true,
        },
      },
    })
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

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
})
