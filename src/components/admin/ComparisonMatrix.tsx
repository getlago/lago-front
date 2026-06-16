import NiceModal from '@ebay/nice-modal-react'

import { Chip } from '~/components/designSystem/Chip'
import { Table } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { FeatureFlagEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'

import { REASON_MODAL_NAME } from './const'
import { ReasonModalProps } from './ReasonModal'

const KNOWN_PREMIUM_INTEGRATIONS = Object.values(PremiumIntegrationTypeEnum)
const KNOWN_FEATURE_FLAGS = Object.values(FeatureFlagEnum)

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
  id: string
  featureKey: string
  featureType: 'premium_integration' | 'feature_flag'
}

const allRows: FeatureRow[] = [
  ...KNOWN_PREMIUM_INTEGRATIONS.map((k) => ({
    id: `premium_integration:${k}`,
    featureKey: k,
    featureType: 'premium_integration' as const,
  })),
  ...KNOWN_FEATURE_FLAGS.map((k) => ({
    id: `feature_flag:${k}`,
    featureKey: k,
    featureType: 'feature_flag' as const,
  })),
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
    <Table<FeatureRow>
      name="admin-comparison-matrix"
      data={visibleRows}
      containerSize={0}
      placeholder={{
        emptyState: {
          title: showDifferencesOnly ? 'No differences found' : 'No features to display',
          subtitle: showDifferencesOnly
            ? 'All selected organizations have identical feature configurations.'
            : undefined,
        },
      }}
      columns={[
        {
          key: 'featureKey',
          title: 'Feature',
          minWidth: 220,
          content: (row) => (
            <Typography variant="body" noWrap>
              {row.featureKey}
            </Typography>
          ),
        },
        {
          key: 'featureType',
          title: 'Type',
          minWidth: 120,
          content: (row) => (
            <Chip
              label={row.featureType === 'premium_integration' ? 'Integration' : 'Flag'}
              size="small"
              color={row.featureType === 'premium_integration' ? 'info600' : 'purple600'}
            />
          ),
        },
        ...organizations.map((org) => ({
          key: 'id' as const,
          title: org.name,
          minWidth: 140,
          content: (row: FeatureRow) => {
            const enabled = isEnabled(org, row)

            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <span className="cursor-pointer" onClick={() => handleCellClick(org, row)}>
                <Chip
                  label={enabled ? 'ON' : 'OFF'}
                  size="small"
                  color={enabled ? 'success600' : 'grey600'}
                />
              </span>
            )
          },
        })),
      ]}
    />
  )
}

export default ComparisonMatrix
