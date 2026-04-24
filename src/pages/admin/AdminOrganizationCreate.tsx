import { gql, useMutation } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { MultipleComboBox } from '~/components/form/MultipleComboBox/MultipleComboBox'
import { TextInput } from '~/components/form/TextInput/TextInput'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ADMIN_ORGANIZATION_DETAIL_ROUTE, ADMIN_ORGANIZATIONS_ROUTE } from '~/core/router'

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

const AdminOrganizationCreate = () => {
  const navigate = useNavigate()

  const [orgName, setOrgName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [timezone, setTimezone] = useState('')
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])

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
              ownerEmail: ownerEmail.trim(),
              ...(timezone.trim() ? { timezone: timezone.trim() } : {}),
              premiumIntegrations: selectedIntegrations,
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
    <CenteredPage.Wrapper>
      <CenteredPage.Header>
        <Typography variant="bodyHl" color="textSecondary">
          Create Organization
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => navigate(ADMIN_ORGANIZATIONS_ROUTE)}
        />
      </CenteredPage.Header>

      <CenteredPage.Container>
        <div className="flex flex-col gap-6">
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

          <MultipleComboBox
            label="Premium Integrations"
            placeholder="Select integrations..."
            data={KNOWN_PREMIUM_INTEGRATIONS.map((key) => ({ value: key }))}
            value={selectedIntegrations.map((key) => ({ value: key }))}
            onChange={(newValue) => setSelectedIntegrations(newValue.map((item) => item.value))}
          />
        </div>
      </CenteredPage.Container>

      <CenteredPage.StickyFooter>
        <Button variant="quaternary" onClick={() => navigate(ADMIN_ORGANIZATIONS_ROUTE)}>
          Cancel
        </Button>
        <Button disabled={!isValid} onClick={handleCreate}>
          Create Organization
        </Button>
      </CenteredPage.StickyFooter>
    </CenteredPage.Wrapper>
  )
}

export default AdminOrganizationCreate
