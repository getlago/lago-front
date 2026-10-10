import { ContractForContractDrawerFragment } from '~/generated/graphql'

import { ContractDrawerCustomer } from './constants'

export const mapContractToDrawerCustomer = (
  contract: ContractForContractDrawerFragment,
): ContractDrawerCustomer => ({
  id: contract.customer.id,
  externalId: contract.customer.externalId,
  displayName: contract.customer.displayName,
  applicableTimezone: contract.customer.applicableTimezone,
  billingEntityId: contract.customer.billingEntity?.id,
})
