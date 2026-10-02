import { MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  AdminAuditLogsDocument,
  AdminOrganizationsDocument,
  AdminRollbackChangeDocument,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import AdminAuditLog from '../AdminAuditLog'
import AdminOrganizations from '../AdminOrganizations'

const organization = {
  id: 'org',
  name: 'Acme',
  email: 'owner@example.com',
  createdAt: '2026-09-17T12:00:00Z',
  premiumIntegrations: ['analytics'],
  featureFlags: ['flag'],
}
const metadata = { currentPage: 1, totalPages: 1, totalCount: 1 }
const audit = {
  id: 'audit',
  actorEmail: 'staff@getlago.com',
  action: 'toggle_on',
  organizationId: 'org',
  organizationName: 'Acme',
  featureType: 'feature_flag',
  featureKey: 'flag',
  beforeValue: 'false',
  afterValue: 'true',
  reason: 'Customer request',
  batchId: null,
  rollbackOfId: null,
  rolledBack: false,
  createdAt: '2026-09-17T12:00:00Z',
}

const organizationsMock = (searchTerm?: string): MockedResponse => ({
  request: {
    query: AdminOrganizationsDocument,
    variables: { page: 1, limit: 20, ...(searchTerm ? { searchTerm } : {}) },
  },
  result: { data: { adminOrganizations: { collection: [organization], metadata } } },
})
const logsMock = (featureKey?: string, rolledBack = false): MockedResponse => ({
  request: { query: AdminAuditLogsDocument, variables: { page: 1, limit: 20, featureKey } },
  result: { data: { adminAuditLogs: { collection: [{ ...audit, rolledBack }], metadata } } },
})

describe('Admin lists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/admin/organizations')
  })
  afterEach(() => jest.restoreAllMocks())

  it('loads organizations, links their details and opens creation', async () => {
    render(
      <>
        <MainHeader />
        <AdminOrganizations />
      </>,
      { mocks: [organizationsMock()] },
    )
    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('analytics')).toBeInTheDocument()
    expect(screen.getByText('flag')).toBeInTheDocument()
    expect(screen.getByText('Acme').closest('a')).toHaveAttribute(
      'href',
      '/admin/organizations/org',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create organization' }))
    expect(testMockNavigateFn).toHaveBeenCalledWith('/admin/organizations/new', {})
  })

  it('debounces organization searches and resets pagination', async () => {
    const result = jest.fn(() => ({
      data: { adminOrganizations: { collection: [], metadata: { ...metadata, totalCount: 0 } } },
    }))

    render(
      <>
        <MainHeader />
        <AdminOrganizations />
      </>,
      { mocks: [organizationsMock(), { ...organizationsMock('missing'), result }] },
    )
    await screen.findByText('Acme')
    fireEvent.change(screen.getByPlaceholderText('Search organizations...'), {
      target: { value: 'missing' },
    })
    await waitFor(() => expect(result).toHaveBeenCalled(), { timeout: 2000 })
    expect(await screen.findByText('No organizations found')).toBeInTheDocument()
    expect(testMockNavigateFn).toHaveBeenCalledWith({ search: '' }, { replace: true })
  })

  it('rolls back an audit entry and refreshes its action state', async () => {
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    const result = jest.fn(() => ({
      data: { adminRollbackChange: { id: 'rollback', action: 'rollback', rollbackOfId: 'audit' } },
    }))

    render(
      <>
        <MainHeader />
        <AdminAuditLog />
      </>,
      {
        mocks: [
          logsMock(),
          {
            request: {
              query: AdminRollbackChangeDocument,
              variables: { input: { auditLogId: 'audit', reason: 'Revert mistaken change' } },
            },
            result,
          },
          logsMock(undefined, true),
        ],
      },
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Rollback' }))
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    await act(() => props.onConfirm('Revert mistaken change', false))
    expect(result).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Rollback' })).not.toBeInTheDocument(),
    )
  })

  it('searches audit entries by feature key', async () => {
    const result = jest.fn(() => ({
      data: { adminAuditLogs: { collection: [], metadata: { ...metadata, totalCount: 0 } } },
    }))

    render(
      <>
        <MainHeader />
        <AdminAuditLog />
      </>,
      { mocks: [logsMock(), { ...logsMock('missing'), result }] },
    )
    await screen.findByText('Customer request')
    fireEvent.change(screen.getByPlaceholderText('Search by feature key...'), {
      target: { value: 'missing' },
    })
    await waitFor(() => expect(result).toHaveBeenCalled(), { timeout: 2000 })
    expect(await screen.findByText('No logs found')).toBeInTheDocument()
  })
})
