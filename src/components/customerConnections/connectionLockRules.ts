import { ConnectionCategory } from '~/components/customerConnections/types'
import { IntegrationTypeEnum, ProviderTypeEnum } from '~/generated/graphql'

/**
 * The customer fields both connection surfaces read to decide what the drawer
 * locks. Structural on purpose: the create/edit form and the information view
 * hold different fragments of the same customer.
 */
type CustomerConnectionState = {
  paymentProvider?: ProviderTypeEnum | null
  paymentProviderCode?: string | null
  providerCustomer?: { providerCustomerId?: string | null } | null
}

type PersistedIntegrationCustomer = {
  integrationCode?: string | null
  integrationType?: IntegrationTypeEnum | null
} | null

/**
 * Whether the connection sitting in a category slot is the one persisted on
 * the customer. The drawer then locks its provider selector: switching
 * provider is a delete plus a create, never an edit of the same link.
 *
 * A connection deleted and re-added within the same session is a new link and
 * stays fully editable, hence the code comparison. Integration categories also
 * require the referenced org integration to still exist, so a dangling link
 * stays fixable.
 */
export const isConnectionProviderPersisted = ({
  category,
  customer,
  slotCode,
  integrationCustomer,
  orgIntegrations,
}: {
  category: ConnectionCategory
  customer: CustomerConnectionState | null | undefined
  slotCode: string | undefined
  integrationCustomer?: PersistedIntegrationCustomer
  orgIntegrations?: { code: string }[]
}): boolean => {
  if (category === ConnectionCategory.Payment) {
    return !!customer?.paymentProvider && !!slotCode && customer.paymentProviderCode === slotCode
  }

  if (!integrationCustomer?.integrationCode || !slotCode) return false
  if (integrationCustomer.integrationCode !== slotCode) return false

  return !!orgIntegrations?.some(
    (integration) => integration.code === integrationCustomer.integrationCode,
  )
}

/**
 * Whether the persisted payment connection also carries a provider-side
 * customer mapping. Stricter than the selector rule above: on top of the
 * locked selector the drawer locks the mapping fields themselves, so a
 * sync-only connection (or a provider that has no provider-side customer)
 * keeps them editable.
 */
export const hasPersistedPaymentMapping = ({
  customer,
  slotCode,
}: {
  customer: CustomerConnectionState | null | undefined
  slotCode: string | undefined
}): boolean =>
  !!customer?.providerCustomer?.providerCustomerId &&
  !!slotCode &&
  customer.paymentProviderCode === slotCode
