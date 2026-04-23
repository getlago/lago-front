import NiceModal from '@ebay/nice-modal-react'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { Typography } from '~/components/designSystem/Typography'

import { REASON_MODAL_NAME } from './const'
import { ReasonModalProps } from './ReasonModal'

const KNOWN_PREMIUM_INTEGRATIONS = [
  'beta_payment_authorization',
  'netsuite',
  'okta',
  'avalara',
  'xero',
  'progressive_billing',
  'lifetime_usage',
  'hubspot',
  'auto_dunning',
  'revenue_analytics',
  'salesforce',
  'api_permissions',
  'revenue_share',
  'remove_branding_watermark',
  'manual_payments',
  'from_email',
  'issue_receipts',
  'preview',
  'multi_entities_pro',
  'multi_entities_enterprise',
]

const KNOWN_FEATURE_FLAGS = [
  'multiple_payment_methods',
  'non_persistable_charge_cache_optimization',
  'postgres_enriched_events',
  'enriched_events_aggregation',
  'wallet_traceability',
  'multi_currency',
  'payment_gated_subscriptions',
  'order_forms',
]

export interface OrgData {
  id: string
  name: string
  premiumIntegrations: string[]
  featureFlags: string[]
}

export interface ComparisonMatrixProps {
  organizations: OrgData[]
  showDifferencesOnly: boolean
  onToggle: (
    orgId: string,
    featureType: string,
    featureKey: string,
    currentlyEnabled: boolean,
    reason: string,
    notifyOrgAdmin: boolean,
  ) => void
}

interface FeatureRow {
  featureKey: string
  featureType: 'premium_integration' | 'feature_flag'
}

const allRows: FeatureRow[] = [
  ...KNOWN_PREMIUM_INTEGRATIONS.map((k) => ({
    featureKey: k,
    featureType: 'premium_integration' as const,
  })),
  ...KNOWN_FEATURE_FLAGS.map((k) => ({ featureKey: k, featureType: 'feature_flag' as const })),
]

const isEnabled = (org: OrgData, row: FeatureRow): boolean => {
  if (row.featureType === 'premium_integration') {
    return (org.premiumIntegrations ?? []).includes(row.featureKey)
  }

  return (org.featureFlags ?? []).includes(row.featureKey)
}

const rowHasDifference = (orgs: OrgData[], row: FeatureRow): boolean => {
  if (orgs.length < 2) return false
  const first = isEnabled(orgs[0], row)

  return orgs.slice(1).some((org) => isEnabled(org, row) !== first)
}

export const ComparisonMatrix = ({
  organizations,
  showDifferencesOnly,
  onToggle,
}: ComparisonMatrixProps) => {
  const visibleRows = showDifferencesOnly
    ? allRows.filter((row) => rowHasDifference(organizations, row))
    : allRows

  if (visibleRows.length === 0) {
    return (
      <Typography
        variant="body"
        color="grey600"
        sx={{ py: 4, textAlign: 'center', display: 'block' }}
      >
        {showDifferencesOnly
          ? 'All selected organizations have identical feature configurations.'
          : 'No features to display.'}
      </Typography>
    )
  }

  const handleCellClick = (org: OrgData, row: FeatureRow) => {
    const currentlyEnabled = isEnabled(org, row)
    const action = currentlyEnabled ? 'Disable' : 'Enable'
    const label = row.featureKey.replace(/_/g, ' ')

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: `${action} ${label} for ${org.name}`,
      description: `Please provide a reason for ${action.toLowerCase()}ing "${row.featureKey}" on "${org.name}".`,
      onConfirm: async (reason: string, notifyOrgAdmin: boolean) => {
        await onToggle(
          org.id,
          row.featureType,
          row.featureKey,
          currentlyEnabled,
          reason,
          notifyOrgAdmin,
        )
      },
    })
  }

  return (
    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 600,
                minWidth: 220,
                backgroundColor: 'background.paper',
                position: 'sticky',
                left: 0,
                zIndex: 3,
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              Feature
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                minWidth: 90,
                backgroundColor: 'background.paper',
                position: 'sticky',
                left: 220,
                zIndex: 3,
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              Type
            </TableCell>
            {organizations.map((org) => (
              <TableCell
                key={org.id}
                align="center"
                sx={{ fontWeight: 600, minWidth: 160, backgroundColor: 'background.paper' }}
              >
                {org.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={`${row.featureType}:${row.featureKey}`} hover>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body" noWrap>
                  {row.featureKey}
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 220,
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" color="grey600" noWrap>
                  {row.featureType === 'premium_integration' ? 'Integration' : 'Flag'}
                </Typography>
              </TableCell>
              {organizations.map((org) => {
                const enabled = isEnabled(org, row)

                return (
                  <TableCell key={org.id} align="center">
                    <Chip
                      label={enabled ? 'ON' : 'OFF'}
                      size="small"
                      onClick={() => handleCellClick(org, row)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: enabled ? 'success.light' : 'grey.200',
                        color: enabled ? 'success.dark' : 'text.secondary',
                        '&:hover': {
                          backgroundColor: enabled ? 'success.main' : 'grey.300',
                        },
                      }}
                    />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default ComparisonMatrix
