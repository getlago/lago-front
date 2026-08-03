import { gql, useMutation } from '@apollo/client'
import NiceModal from '@ebay/nice-modal-react'
import { revalidateLogic } from '@tanstack/react-form'
import { FormEvent } from 'react'
import { generatePath } from 'react-router-dom'

import { REASON_MODAL_NAME } from '~/components/admin/const'
import { ReasonModalProps } from '~/components/admin/ReasonModal'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast } from '~/core/apolloClient'
import {
  ADMIN_ORGANIZATION_DETAIL_ROUTE,
  ADMIN_ORGANIZATIONS_ROUTE,
  useNavigate,
} from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { FeatureFlagEnum, PremiumIntegrationTypeEnum, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  AdminOrganizationCreateFormValues,
  adminOrganizationCreateValidationSchema,
} from './adminOrganizationCreate/validationSchema'

const ADMIN_CREATE_ORGANIZATION_MUTATION = gql`
  mutation AdminCreateOrganization($input: AdminCreateOrganizationInput!) {
    adminCreateOrganization(input: $input) {
      inviteUrl
      organization {
        id
        name
      }
    }
  }
`

const KNOWN_PREMIUM_INTEGRATIONS = Object.values(PremiumIntegrationTypeEnum)
const KNOWN_FEATURE_FLAGS = Object.values(FeatureFlagEnum)

const AdminOrganizationCreate = () => {
  const navigate = useNavigate()
  const inviteLinkDialog = useCentralizedDialog()

  const { translate } = useInternationalization()

  const [createOrganization] = useMutation(ADMIN_CREATE_ORGANIZATION_MUTATION)

  const showInviteLinkDialog = (inviteUrl: string, organizationId: string, ownerEmail: string) => {
    inviteLinkDialog
      .open({
        title: 'Organization Created',
        description: `Share this invite link with the organization owner (${ownerEmail}).`,
        actionText: 'Copy invite link',
        children: (
          <div className="flex flex-col gap-6 p-8">
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                Email
              </Typography>
              <Typography variant="body" color="grey700" noWrap>
                {ownerEmail}
              </Typography>
            </div>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                Invite URL
              </Typography>
              <Typography className="line-break-anywhere" variant="body" color="grey700">
                {inviteUrl}
              </Typography>
            </div>
          </div>
        ),
        onAction: () => {
          copyToClipboard(inviteUrl)
          addToast({
            severity: 'info',
            message: 'Invite link copied to clipboard.',
          })
        },
      })
      .then(() => {
        navigate(generatePath(ADMIN_ORGANIZATION_DETAIL_ROUTE, { organizationId }), {
          skipSlugPrepend: true,
        })
      })
  }

  const openReasonModal = (value: AdminOrganizationCreateFormValues) => {
    const name = value.name.trim()
    const ownerEmail = value.ownerEmail.trim()

    NiceModal.show<void, ReasonModalProps>(REASON_MODAL_NAME, {
      title: 'Create Organization',
      description: `Please provide a reason for creating organization "${name}".`,
      showNotifyCheckbox: false,
      onConfirm: async (reason: string) => {
        const result = await createOrganization({
          variables: {
            input: {
              name,
              ownerEmail,
              ...(value.timezone ? { timezone: value.timezone } : {}),
              premiumIntegrations: value.premiumIntegrations.map((item) => item.value),
              featureFlags: value.featureFlags.map((item) => item.value),
              reason,
            },
          },
        })

        const payload = result.data?.adminCreateOrganization

        if (payload?.organization?.id) {
          showInviteLinkDialog(payload.inviteUrl, payload.organization.id, ownerEmail)
        } else {
          addToast({
            severity: 'danger',
            message: 'Failed to create organization. Please try again.',
          })
        }
      },
    })
  }

  const form = useAppForm({
    defaultValues: {
      name: '',
      ownerEmail: '',
      timezone: undefined,
      premiumIntegrations: [],
      featureFlags: [],
    } as AdminOrganizationCreateFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: adminOrganizationCreateValidationSchema,
    },
    onSubmit: async ({ value }) => {
      openReasonModal(value)
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary">
            Create Organization
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() => navigate(ADMIN_ORGANIZATIONS_ROUTE, { skipSlugPrepend: true })}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          <div className="flex flex-col gap-6">
            <form.AppField name="name">
              {(field) => (
                <field.TextInputField label="Organization Name" placeholder="Acme Corp" />
              )}
            </form.AppField>

            <form.AppField name="ownerEmail">
              {(field) => (
                <field.TextInputField label="Owner Email" placeholder="owner@example.com" />
              )}
            </form.AppField>

            <form.AppField name="timezone">
              {(field) => (
                <field.ComboBoxField
                  label="Timezone"
                  placeholder="UTC (optional)"
                  data={Object.values(TimezoneEnum).map((timezoneValue) => ({
                    value: timezoneValue,
                    label: translate('text_638f743fa9a2a9545ee6409a', {
                      zone: translate(timezoneValue),
                      offset: getTimezoneConfig(timezoneValue).offset,
                    }),
                  }))}
                />
              )}
            </form.AppField>

            <form.AppField name="premiumIntegrations">
              {(field) => (
                <field.MultipleComboBoxField
                  disableCloseOnSelect
                  label="Premium Integrations"
                  placeholder="Select integrations..."
                  data={KNOWN_PREMIUM_INTEGRATIONS.map((key) => ({ value: key }))}
                />
              )}
            </form.AppField>

            <form.AppField name="featureFlags">
              {(field) => (
                <field.MultipleComboBoxField
                  disableCloseOnSelect
                  label="Feature Flags"
                  placeholder="Select feature flags..."
                  data={KNOWN_FEATURE_FLAGS.map((key) => ({ value: key }))}
                />
              )}
            </form.AppField>
          </div>
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            onClick={() => navigate(ADMIN_ORGANIZATIONS_ROUTE, { skipSlugPrepend: true })}
          >
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>Create Organization</form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default AdminOrganizationCreate
