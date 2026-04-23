import NiceModal from '@ebay/nice-modal-react'
import Box from '@mui/material/Box'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
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
  createdAt: string
}

type ActionChipConfig = {
  label: string
  color: 'success600' | 'danger600' | 'grey700' | 'warning700'
}

const ACTION_CHIP_MAP: Record<string, ActionChipConfig> = {
  toggle_on: { label: 'Toggle On', color: 'success600' },
  toggle_off: { label: 'Toggle Off', color: 'danger600' },
  org_created: { label: 'Org Created', color: 'grey700' },
  rollback: { label: 'Rollback', color: 'warning700' },
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
            const chip = ACTION_CHIP_MAP[entry.action] ?? {
              label: entry.action,
              color: 'grey700' as const,
            }

            return <Chip label={chip.label} size="small" color={chip.color} />
          },
        },
        {
          key: 'featureKey',
          title: 'Feature',
          minWidth: 180,
          content: (entry) => {
            if (!entry.featureKey) return <Typography color="grey600">-</Typography>

            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="body" noWrap>
                  {entry.featureKey}
                </Typography>
                {entry.featureType && (
                  <Typography variant="caption" color="grey600" noWrap>
                    {entry.featureType}
                  </Typography>
                )}
              </Box>
            )
          },
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
            if (entry.action === 'rollback') return null

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
