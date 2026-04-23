import { gql, useMutation } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form/TextInput/TextInput'
import { ADMIN_ORGANIZATION_DETAIL_ROUTE } from '~/core/router'

const ADMIN_CREATE_ORGANIZATION_MUTATION = gql`
  mutation AdminCreateOrganization($input: AdminCreateOrganizationInput!) {
    adminCreateOrganization(input: $input) {
      id
      name
    }
  }
`

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

const AdminOrganizationCreate = () => {
  const navigate = useNavigate()

  const [orgName, setOrgName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [timezone, setTimezone] = useState('')
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [selectedFlags, setSelectedFlags] = useState<string[]>([])

  const [createOrganization] = useMutation(ADMIN_CREATE_ORGANIZATION_MUTATION)

  const isValid = orgName.trim().length > 0 && ownerEmail.trim().length > 0

  const handleCreate = () => {
    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: 'Create Organization',
      description: `Please provide a reason for creating organization "${orgName.trim()}".`,
      showNotifyCheckbox: false,
      onConfirm: async (reason: string) => {
        const result = await createOrganization({
          variables: {
            input: {
              name: orgName.trim(),
              email: ownerEmail.trim(),
              ...(timezone.trim() ? { timezone: timezone.trim() } : {}),
              premiumIntegrations: selectedIntegrations,
              featureFlags: selectedFlags,
              reason,
            },
          },
        })

        const createdOrg = result.data?.adminCreateOrganization

        if (createdOrg?.id) {
          navigate(generatePath(ADMIN_ORGANIZATION_DETAIL_ROUTE, { organizationId: createdOrg.id }))
        }
      },
    })
  }

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="headline" sx={{ mb: 4 }}>
        Create Organization
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextInput
          label="Organization Name"
          placeholder="Acme Corp"
          value={orgName}
          onChange={(value) => setOrgName(value)}
          required
        />

        <TextInput
          label="Owner Email"
          placeholder="owner@example.com"
          value={ownerEmail}
          onChange={(value) => setOwnerEmail(value)}
          required
        />

        <TextInput
          label="Timezone"
          placeholder="UTC (optional)"
          value={timezone}
          onChange={(value) => setTimezone(value)}
        />

        <Box>
          <Typography variant="captionHl" sx={{ mb: 1, display: 'block' }}>
            Premium Integrations
          </Typography>
          <Autocomplete
            multiple
            options={KNOWN_PREMIUM_INTEGRATIONS}
            value={selectedIntegrations}
            onChange={(_, newValue) => setSelectedIntegrations(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })

                return <Chip key={key} label={option} size="small" {...tagProps} />
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={selectedIntegrations.length === 0 ? 'Select integrations...' : ''}
                size="small"
              />
            )}
          />
        </Box>

        <Box>
          <Typography variant="captionHl" sx={{ mb: 1, display: 'block' }}>
            Feature Flags
          </Typography>
          <Autocomplete
            multiple
            options={KNOWN_FEATURE_FLAGS}
            value={selectedFlags}
            onChange={(_, newValue) => setSelectedFlags(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index })

                return <Chip key={key} label={option} size="small" {...tagProps} />
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={selectedFlags.length === 0 ? 'Select feature flags...' : ''}
                size="small"
              />
            )}
          />
        </Box>

        <Box sx={{ pt: 1 }}>
          <Button disabled={!isValid} onClick={handleCreate}>
            Create Organization
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default AdminOrganizationCreate
