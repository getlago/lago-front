import NiceModal from '@ebay/nice-modal-react'
import { act, fireEvent, screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { AuditLogEntry, AuditLogTable } from '../AuditLogTable'
import { ReasonModalProps } from '../ReasonModal'

const entry: AuditLogEntry = {
  id: 'audit',
  actorEmail: 'staff@getlago.com',
  action: 'toggle_on',
  organizationId: 'org',
  organizationName: 'Acme',
  featureType: 'feature_flag',
  featureKey: 'test_feature',
  beforeValue: 'false',
  afterValue: 'true',
  reason: 'Customer request',
  batchId: null,
  rollbackOfId: null,
  rolledBack: false,
  createdAt: '2026-09-17T12:00:00Z',
}

describe('AuditLogTable', () => {
  afterEach(() => jest.restoreAllMocks())
  it('requires a reason before invoking rollback', async () => {
    jest.spyOn(NiceModal, 'show').mockResolvedValue(undefined)
    const onRollback = jest.fn()

    render(
      <AuditLogTable data={[entry]} isLoading={false} hasError={false} onRollback={onRollback} />,
    )
    expect(screen.getByText('test_feature')).toBeInTheDocument()
    expect(screen.getByText('Customer request')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Rollback'))
    expect(onRollback).not.toHaveBeenCalled()
    const props = jest.mocked(NiceModal.show).mock.calls[0][1] as ReasonModalProps

    expect(props.showNotifyCheckbox).toBe(false)
    await act(() => props.onConfirm('Reverting mistaken change', false))
    expect(onRollback).toHaveBeenCalledWith(entry, 'Reverting mistaken change')
  })

  it.each(['rollback', 'org_created', 'already_rolled_back'])('hides rollback for %s', (kind) => {
    render(
      <AuditLogTable
        data={[
          {
            ...entry,
            action: kind === 'already_rolled_back' ? 'toggle_off' : kind,
            rolledBack: kind === 'already_rolled_back',
          },
        ]}
        isLoading={false}
        hasError={false}
        onRollback={jest.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Rollback' })).not.toBeInTheDocument()
  })

  it('renders integration changes and missing organization metadata', () => {
    render(
      <AuditLogTable
        data={[
          {
            ...entry,
            featureType: 'premium_integration',
            organizationName: null,
            actorEmail: null,
            reason: null,
          },
        ]}
        isLoading={false}
        hasError={false}
        onRollback={jest.fn()}
      />,
    )
    expect(screen.getByText('test_feature')).toBeInTheDocument()
    expect(screen.getByText('org')).toBeInTheDocument()
  })

  it('renders a useful empty state for a feature search', () => {
    render(
      <AuditLogTable
        data={[]}
        featureKey="missing"
        isLoading={false}
        hasError={false}
        onRollback={jest.fn()}
      />,
    )
    expect(screen.getByText('No logs found')).toBeInTheDocument()
  })
})
