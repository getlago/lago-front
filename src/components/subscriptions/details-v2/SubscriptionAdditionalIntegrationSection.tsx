import { ADDITIONAL_INTEGRATION_CATEGORIES } from '~/components/additionalIntegrationSettings/additionalIntegrationSettingsSchema'
import { useAdditionalIntegrationSettingsDrawer } from '~/components/additionalIntegrationSettings/useAdditionalIntegrationSettingsDrawer'
import {
  findConnectionRouting,
  toSelectedConnection,
} from '~/components/connectionSelection/fromConnectionRouting'
import { useConnectionRoutingGridItems } from '~/components/connectionSelection/useConnectionRoutingGridItems'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import {
  ConnectionCategoryEnum,
  FeatureFlagEnum,
  SubscriptionPaymentSectionFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionSettings } from '~/hooks/customer/useUpdateSubscriptionSettings'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

type Props = {
  subscription: SubscriptionPaymentSectionFragment
}

export const SubscriptionAdditionalIntegrationSection = ({
  subscription,
}: Props): JSX.Element | null => {
  const { translate } = useInternationalization()
  const { hasFeatureFlag } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  const { saveAdditionalIntegrations } = useUpdateSubscriptionSettings(subscription.id)
  const { openDrawer } = useAdditionalIntegrationSettingsDrawer({
    customerId: subscription.customer?.id ?? '',
    description: translate('text_178948416677832fz1lquc9c'),
    onSave: saveAdditionalIntegrations,
  })
  const items = useConnectionRoutingGridItems({
    categories: ADDITIONAL_INTEGRATION_CATEGORIES,
    connections: subscription.connections,
    customerId: subscription.customer?.id,
  })

  if (!hasFeatureFlag(FeatureFlagEnum.MultiConnection)) return null

  const openIntegrationsDrawer = (): void => {
    openDrawer({
      accounting: toSelectedConnection(
        findConnectionRouting(subscription.connections, ConnectionCategoryEnum.Accounting),
      ),
      crm: toSelectedConnection(
        findConnectionRouting(subscription.connections, ConnectionCategoryEnum.Crm),
      ),
      tax: toSelectedConnection(
        findConnectionRouting(subscription.connections, ConnectionCategoryEnum.Tax),
      ),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_178955797239251hkkoh9sbb')}
        description={translate('text_1789993764219afh0d4kcj7a')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          startIcon: 'pen',
          onClick: openIntegrationsDrawer,
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
      />
      <DetailsPage.InfoGrid grid={items} />
    </section>
  )
}
