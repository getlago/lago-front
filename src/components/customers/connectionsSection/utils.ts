import { ConnectionCategory } from '~/components/customerConnections/types'
import { AddCustomerDrawerFragment } from '~/generated/graphql'

/** The three categories persisted through the `integrationCustomers` input */
export const INTEGRATION_CATEGORIES = [
  ConnectionCategory.Accounting,
  ConnectionCategory.Tax,
  ConnectionCategory.Crm,
] as const

export type FragmentIntegrationCustomer = NonNullable<
  | AddCustomerDrawerFragment['netsuiteCustomer']
  | AddCustomerDrawerFragment['xeroCustomer']
  | AddCustomerDrawerFragment['anrokCustomer']
  | AddCustomerDrawerFragment['avalaraCustomer']
  | AddCustomerDrawerFragment['hubspotCustomer']
  | AddCustomerDrawerFragment['salesforceCustomer']
>

/** The (one-per-type) integration customer persisted for a category, if any */
export const getIntegrationCustomerForCategory = (
  customer: AddCustomerDrawerFragment,
  category: ConnectionCategory,
): FragmentIntegrationCustomer | undefined => {
  switch (category) {
    case ConnectionCategory.Accounting:
      return customer.netsuiteCustomer ?? customer.xeroCustomer ?? undefined
    case ConnectionCategory.Tax:
      return customer.anrokCustomer ?? customer.avalaraCustomer ?? undefined
    case ConnectionCategory.Crm:
      return customer.hubspotCustomer ?? customer.salesforceCustomer ?? undefined
    default:
      return undefined
  }
}
