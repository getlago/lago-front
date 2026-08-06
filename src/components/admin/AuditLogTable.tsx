import NiceModal from '@ebay/nice-modal-react'

import { Button } from '~/components/designSystem/Button'
import { Status, StatusType } from '~/components/designSystem/Status'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'

import { REASON_MODAL_NAME } from './const'
import { ReasonModalProps } from './ReasonModal'

export type AuditLogEntry = {
  id: string
  actorEmail: string | null
  action: string
  organizationId: string | null
  organizationName: string | null
  featureType: string | null
  featureKey: string | null
  beforeValue: string | null
  afterValue: string | null
  reason: string | null
  batchId: string | null
  rollbackOfId: string | null
  rolledBack: boolean
  createdAt: string
}

type ActionStatusConfig = {
  label: string
  type: StatusType
}

const ACTION_STATUS_MAP: Record<string, ActionStatusConfig> = {
  toggle_on: { label: 'Toggle On', type: StatusType.success },
  toggle_off: { label: 'Toggle Off', type: StatusType.danger },
  org_created: { label: 'Org Created', type: StatusType.default },
  rollback: { label: 'Rollback', type: StatusType.warning },
}

// A feature toggle carries its key in exactly one of the two feature-type columns; every other
// entry (e.g. org_created) shows "-" in both. Splitting the columns removes the ambiguous
// Integration/Flag type chip entirely.
const renderFeatureKeyCell = (
  entry: AuditLogEntry,
  type: 'premium_integration' | 'feature_flag',
) => {
  if (entry.featureType !== type || !entry.featureKey) {
    return <Typography color="grey600">-</Typography>
  }

  return (
    <Typography variant="body" noWrap>
      {entry.featureKey}
    </Typography>
  )
}

type AuditLogTableProps = {
  data: AuditLogEntry[]
  isLoading: boolean
  hasError: boolean
  featureKey?: string
  onRollback: (entry: AuditLogEntry, reason: string) => void | Promise<void>
}

export const AuditLogTable = ({
  data,
  isLoading,
  hasError,
  featureKey,
  onRollback,
}: AuditLogTableProps) => {
  const handleRollback = (entry: AuditLogEntry) => {
    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: 'Rollback change',
      description: `Provide a reason for rolling back "${entry.featureKey ?? entry.action}" on "${entry.organizationName ?? entry.organizationId}".`,
      showNotifyCheckbox: false,
      onConfirm: async (reason: string) => {
        await onRollback(entry, reason)
      },
    })
  }

  return (
    <Table
      name="admin-audit-log-table"
      isLoading={isLoading}
      hasError={hasError}
      data={data}
      containerSize={{ default: 16, md: 48 }}
      containerClassName="border-t border-grey-300"
      placeholder={{
        errorState: {
          title: 'Something went wrong',
          subtitle: 'Failed to load audit logs.',
          buttonTitle: 'Retry',
          buttonAction: () => location.reload(),
          buttonVariant: 'primary',
        },
        emptyState: {
          title: featureKey ? 'No logs found' : 'No audit logs yet',
          subtitle: featureKey
            ? `No audit log entries for feature key "${featureKey}".`
            : 'Audit log entries will appear here.',
        },
      }}
      columns={[
        {
          key: 'createdAt',
          title: 'When',
          minWidth: 160,
          content: (entry) => {
            const formatted = intlFormatDateTime(entry.createdAt, {
              formatDate: DateFormat.DATE_MED,
            })

            return (
              <Typography variant="body" color="grey600" noWrap>
                {formatted.date} {formatted.time}
              </Typography>
            )
          },
        },
        {
          key: 'action',
          title: 'Action',
          minWidth: 130,
          content: (entry) => {
            const status = ACTION_STATUS_MAP[entry.action] ?? {
              label: entry.action,
              type: StatusType.default,
            }

            return <Status type={status.type} label={status.label} />
          },
        },
        {
          key: 'featureType',
          title: 'Premium integration',
          minWidth: 180,
          content: (entry) => renderFeatureKeyCell(entry, 'premium_integration'),
        },
        {
          key: 'featureKey',
          title: 'Feature flag',
          minWidth: 180,
          content: (entry) => renderFeatureKeyCell(entry, 'feature_flag'),
        },
        {
          key: 'organizationName',
          title: 'Organization',
          maxSpace: true,
          minWidth: 180,
          content: (entry) => (
            <Typography variant="body" color="textSecondary" noWrap>
              {entry.organizationName ?? entry.organizationId ?? '-'}
            </Typography>
          ),
        },
        {
          key: 'actorEmail',
          title: 'Actor',
          minWidth: 200,
          content: (entry) => (
            <Typography variant="body" color="grey600" noWrap>
              {entry.actorEmail ?? '-'}
            </Typography>
          ),
        },
        {
          key: 'reason',
          title: 'Reason',
          minWidth: 200,
          content: (entry) => (
            <Typography variant="body" color="grey600">
              {entry.reason ?? '-'}
            </Typography>
          ),
        },
        {
          key: 'id',
          title: 'Actions',
          minWidth: 100,
          content: (entry) => {
            // Rollback only applies to feature toggles. Hide it for rollback entries themselves,
            // org-creation entries (not reversible), and changes already rolled back.
            if (entry.action === 'rollback' || entry.action === 'org_created' || entry.rolledBack) {
              return null
            }

            return (
              <Button
                size="small"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRollback(entry)
                }}
              >
                Rollback
              </Button>
            )
          },
        },
      ]}
    />
  )
}

export default AuditLogTable
