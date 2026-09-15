import { integrationAvatarMapping } from '~/components/avatarMappings'
import { ConnectionBehaviorFields } from '~/components/connectionSelection/ConnectionBehaviorFields'
import { CustomerIntegrationConnectionComboBox } from '~/components/connectionSelection/CustomerIntegrationConnectionComboBox'
import { ConnectionBehavior, SelectedConnection } from '~/components/connectionSelection/types'
import {
  CONNECTION_CATEGORY_SHORT_LABEL_KEYS,
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { Avatar } from '~/components/designSystem/Avatar'
import { Chip } from '~/components/designSystem/Chip'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerIntegrationConnections } from '~/hooks/customer/useCustomerIntegrationConnections'

export const getAdditionalIntegrationSectionTestId = (
  category: IntegrationConnectionCategory,
): string => `additional-integration-section-${category}`

export const getAdditionalIntegrationDefaultChipTestId = (
  category: IntegrationConnectionCategory,
): string => `additional-integration-default-chip-${category}`

export const getAdditionalIntegrationNoDefaultChipTestId = (
  category: IntegrationConnectionCategory,
): string => `additional-integration-no-default-chip-${category}`

const SECTION_DESCRIPTION_KEYS: Record<IntegrationConnectionCategory, string> = {
  [ConnectionCategory.Accounting]: 'text_17894722527939a63qfcbsq7',
  [ConnectionCategory.Crm]: 'text_1789472252793b2pou5uhlga',
  [ConnectionCategory.Tax]: 'text_17894722527934hwum28uzp9',
}

const INHERIT_LABEL_KEYS: Record<IntegrationConnectionCategory, string> = {
  [ConnectionCategory.Accounting]: 'text_17894722527938f62t2pxak2',
  [ConnectionCategory.Crm]: 'text_1789472252793n31n0milktd',
  [ConnectionCategory.Tax]: 'text_1789472252793fujnc22e4yz',
}

const SKIP_LABEL_KEYS: Record<IntegrationConnectionCategory, string> = {
  [ConnectionCategory.Accounting]: 'text_1789472252793qsz047zqj1f',
  [ConnectionCategory.Crm]: 'text_1789472252793xhhxu5hrfl6',
  [ConnectionCategory.Tax]: 'text_178947225279302z0avkir6e',
}

const SKIP_SUBLABEL_KEYS: Record<IntegrationConnectionCategory, string> = {
  [ConnectionCategory.Accounting]: 'text_178947225279345ujz3ib50b',
  [ConnectionCategory.Crm]: 'text_1789472252793k206d5rs8u8',
  [ConnectionCategory.Tax]: 'text_1789472252793d7lq6zbrhzm',
}

interface AdditionalIntegrationSettingsSectionProps {
  category: IntegrationConnectionCategory
  customerId: string
  value: SelectedConnection
  onChange: (value: SelectedConnection) => void
  error?: string
}

export const AdditionalIntegrationSettingsSection = ({
  category,
  customerId,
  value,
  onChange,
  error,
}: AdditionalIntegrationSettingsSectionProps) => {
  const { translate } = useInternationalization()
  const { defaultConnection, loading } = useCustomerIntegrationConnections({ customerId, category })

  const renderBadge = (optionBehavior: ConnectionBehavior) => {
    if (optionBehavior !== ConnectionBehavior.INHERIT) return null
    if (loading) return null

    if (!defaultConnection) {
      return (
        <Chip
          color="grey600"
          label={translate('text_1789382180711vi1jj3immjw')}
          data-test={getAdditionalIntegrationNoDefaultChipTestId(category)}
        />
      )
    }

    return (
      <Chip
        label={
          <span className="flex items-center gap-2">
            {!!integrationAvatarMapping[defaultConnection.integrationType] && (
              <Avatar size="small" variant="connector-full">
                {integrationAvatarMapping[defaultConnection.integrationType]}
              </Avatar>
            )}
            {defaultConnection.code}
          </span>
        }
        data-test={getAdditionalIntegrationDefaultChipTestId(category)}
      />
    )
  }

  const renderChoiceContent = ({
    behavior,
    code,
    onCodeChange,
  }: {
    behavior: ConnectionBehavior
    code: string
    onCodeChange: (value: string) => void
  }) => {
    if (behavior !== ConnectionBehavior.SPECIFIC) return null

    return (
      <CustomerIntegrationConnectionComboBox
        customerId={customerId}
        category={category}
        value={code}
        onChange={onCodeChange}
        error={error}
        PopperProps={{ displayInDialog: true }}
      />
    )
  }

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[category])}
        description={translate(SECTION_DESCRIPTION_KEYS[category])}
      />
      <div data-test={getAdditionalIntegrationSectionTestId(category)}>
        <ConnectionBehaviorFields
          name={`${category}ConnectionBehavior`}
          value={value}
          onChange={onChange}
          labels={{
            [ConnectionBehavior.INHERIT]: {
              label: translate(INHERIT_LABEL_KEYS[category]),
            },
            [ConnectionBehavior.SPECIFIC]: {
              label: translate('text_1789374590509lq5ubwjbszf'),
            },
            [ConnectionBehavior.SKIP]: {
              label: translate(SKIP_LABEL_KEYS[category]),
              sublabel: translate(SKIP_SUBLABEL_KEYS[category]),
            },
          }}
          renderBadge={renderBadge}
          renderChoiceContent={renderChoiceContent}
        />
      </div>
    </CenteredPage.PageSection>
  )
}
