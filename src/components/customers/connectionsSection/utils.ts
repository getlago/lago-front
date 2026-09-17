import {
  INTEGRATION_TYPE_TO_CATEGORY,
  MANUAL_CONNECTION_CODE,
} from '~/components/customerConnections/customerIntegrationConst'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { AddCustomerDrawerFragment } from '~/generated/graphql'

/** The three categories persisted through the `integrationCustomers` input */
export const INTEGRATION_CATEGORIES = [
  ConnectionCategory.Accounting,
  ConnectionCategory.Tax,
  ConnectionCategory.Crm,
] as const

export type FragmentIntegrationCustomer = NonNullable<
  AddCustomerDrawerFragment['integrationCustomers']
>[number]

export type FragmentPaymentProviderCustomer = NonNullable<
  AddCustomerDrawerFragment['paymentProviderCustomers']
>[number]

/**
 * The customer's provider-backed payment connection, if any. Manual rows
 * (persisted or the backend's non-persisted placeholder) carry the reserved
 * "manual" code and are never surfaced as a provider connection.
 */
export const getProviderPaymentConnection = (
  customer: AddCustomerDrawerFragment,
): FragmentPaymentProviderCustomer | undefined =>
  customer.paymentProviderCustomers?.find(
    (connection) => connection.code !== MANUAL_CONNECTION_CODE,
  )

/** The (one-per-type) integration customer persisted for a category, if any */
export const getIntegrationCustomerForCategory = (
  customer: AddCustomerDrawerFragment,
  category: ConnectionCategory,
): FragmentIntegrationCustomer | undefined => {
  if (category === ConnectionCategory.Payment) return undefined

  return customer.integrationCustomers?.find(
    (integrationCustomer) =>
      integrationCustomer.integrationType &&
      INTEGRATION_TYPE_TO_CATEGORY[integrationCustomer.integrationType] === category,
  )
}
