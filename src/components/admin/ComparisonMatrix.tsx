import NiceModal from '@ebay/nice-modal-react'

import { Chip } from '~/components/designSystem/Chip'
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
      <Typography variant="body" color="grey600" className="block py-4 text-center">
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
    <div className="overflow-hidden rounded-xl border border-grey-300">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-grey-100">
            <th className="sticky left-0 z-[3] min-w-55 border-b border-r border-grey-300 bg-grey-100 px-4 py-3 text-left font-semibold">
              Feature
            </th>
            <th className="sticky left-[220px] z-[3] min-w-[90px] border-b border-r border-grey-300 bg-grey-100 px-4 py-3 text-left font-semibold">
              Type
            </th>
            {organizations.map((org) => (
              <th
                key={org.id}
                className="min-w-40 border-b border-grey-300 bg-grey-100 px-4 py-3 text-center font-semibold"
              >
                {org.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={`${row.featureType}:${row.featureKey}`} className="hover:bg-grey-50">
              <td className="sticky left-0 z-[1] border-b border-r border-grey-300 bg-white px-4 py-3">
                <Typography variant="body" noWrap>
                  {row.featureKey}
                </Typography>
              </td>
              <td className="sticky left-[220px] z-[1] border-b border-r border-grey-300 bg-white px-4 py-3">
                <Typography variant="caption" color="grey600" noWrap>
                  {row.featureType === 'premium_integration' ? 'Integration' : 'Flag'}
                </Typography>
              </td>
              {organizations.map((org) => {
                const enabled = isEnabled(org, row)

                return (
                  <td key={org.id} className="border-b border-grey-300 px-4 py-3 text-center">
                    <span className="cursor-pointer" onClick={() => handleCellClick(org, row)}>
                      <Chip
                        label={enabled ? 'ON' : 'OFF'}
                        size="small"
                        color={enabled ? 'success600' : 'grey600'}
                      />
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ComparisonMatrix
