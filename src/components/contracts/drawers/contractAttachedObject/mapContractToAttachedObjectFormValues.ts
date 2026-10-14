import { ContractForContractDrawerFragment } from '~/generated/graphql'

import { ContractAttachedObjectFormValues } from './constants'

export const mapContractToAttachedObjectFormValues = (
  contract: ContractForContractDrawerFragment,
): ContractAttachedObjectFormValues => ({
  externalCustomerId: contract.customer.externalId,
  billingEntityId: contract.billingEntityId ?? contract.customer.billingEntity?.id,
  // `Contract.plan` is nullable in the API, but a V1 contract needs one: a plan-less one must pick it.
  planCode: contract.plan?.code ?? '',
})
