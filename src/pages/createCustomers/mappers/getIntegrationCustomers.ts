import { IntegrationCustomerInput } from '~/generated/graphql'

import { CreateCustomerDefaultValues } from '../formInitialization/validationSchema'

/**
 * Form integration connections → `integrationCustomers` input items. Each
 * persisted connection keeps its id so the backend updates the existing link
 * instead of destroying and recreating it.
 */
export const getIntegrationCustomers = (
  integrationCustomers: CreateCustomerDefaultValues['integrationCustomers'],
): Array<IntegrationCustomerInput> => {
  return (integrationCustomers ?? []).flatMap((integrationCustomer) => {
    // An item without a resolved provider cannot be persisted (the drawer
    // always resolves both before saving into the form)
    if (!integrationCustomer.providerCode || !integrationCustomer.providerType) {
      return []
    }

    return [
      {
        id: integrationCustomer.id,
        integrationCode: integrationCustomer.providerCode,
        integrationType: integrationCustomer.providerType,
        syncWithProvider: integrationCustomer.syncWithProvider,
        externalCustomerId: integrationCustomer.externalCustomerId,
        ...(integrationCustomer.subsidiaryId
          ? { subsidiaryId: integrationCustomer.subsidiaryId }
          : {}),
        ...(integrationCustomer.targetedObject
          ? { targetedObject: integrationCustomer.targetedObject }
          : {}),
      },
    ]
  })
}
