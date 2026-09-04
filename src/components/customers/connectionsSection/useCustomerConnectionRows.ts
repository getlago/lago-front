import { useMemo } from 'react'

import { integrationAvatarMapping, paymentAvatarMapping } from '~/components/avatarMappings'
import { CustomerConnectionRow } from '~/components/customerConnections/CustomerConnectionsList'
import { getConnectionRowId } from '~/components/customerConnections/getConnectionRowId'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useConnectionOptions } from '~/components/customerConnections/useConnectionOptions'
import { getIntegrationCustomerForCategory } from '~/components/customers/connectionsSection/utils'
import { CustomerDetailsFragment } from '~/generated/graphql'

type UseCustomerConnectionRowsProps = {
  customer: CustomerDetailsFragment
  connectionOptions: ReturnType<typeof useConnectionOptions>
}

/**
 * Derives the master-detail list rows from the customer fragment: the
 * persisted provider payment connection and the one-per-type integration
 * connections. A dangling link (org integration deleted) keeps its row —
 * name falls back to the connection code — so it stays visible and
 * deletable. The hardcoded manual-payment row lands with the default flow:
 * without the Default concept it would be an ambiguous dead row.
 */
export const useCustomerConnectionRows = ({
  customer,
  connectionOptions,
}: UseCustomerConnectionRowsProps): CustomerConnectionRow[] => {
  const { paymentProviders, allAccountingIntegrations, allTaxIntegrations, allCrmIntegrations } =
    connectionOptions

  return useMemo(() => {
    const rows: CustomerConnectionRow[] = []

    if (customer.paymentProvider && customer.paymentProviderCode) {
      const provider = paymentProviders?.paymentProviders?.collection.find(
        (p) => p.code === customer.paymentProviderCode,
      )

      rows.push({
        id: getConnectionRowId(ConnectionCategory.Payment, customer.paymentProviderCode),
        category: ConnectionCategory.Payment,
        name: provider?.name ?? customer.paymentProviderCode,
        code: customer.paymentProviderCode,
        icon: paymentAvatarMapping[customer.paymentProvider],
      })
    }

    const integrationLists = {
      [ConnectionCategory.Accounting]: allAccountingIntegrations,
      [ConnectionCategory.Tax]: allTaxIntegrations,
      [ConnectionCategory.Crm]: allCrmIntegrations,
    }

    for (const [category, integrations] of Object.entries(integrationLists)) {
      const existing = getIntegrationCustomerForCategory(customer, category as ConnectionCategory)

      if (!existing?.integrationCode) continue

      const orgIntegration = integrations.find((i) => i.code === existing.integrationCode)

      rows.push({
        id: getConnectionRowId(category as ConnectionCategory, existing.integrationCode),
        category: category as ConnectionCategory,
        name: orgIntegration?.name ?? existing.integrationCode,
        code: existing.integrationCode,
        icon: existing.integrationType
          ? integrationAvatarMapping[existing.integrationType]
          : undefined,
      })
    }

    return rows
  }, [
    customer,
    paymentProviders?.paymentProviders?.collection,
    allAccountingIntegrations,
    allTaxIntegrations,
    allCrmIntegrations,
  ])
}
