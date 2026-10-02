import { ContractForContractDrawerFragment } from '~/generated/graphql'

import { ContractAttachedObjectFormValues } from './constants'

export const mapContractToAttachedObjectFormValues = (
  contract: ContractForContractDrawerFragment,
): ContractAttachedObjectFormValues => ({
  externalCustomerId: contract.customer.externalId,
  billingEntityId: contract.billingEntityId ?? contract.customer.billingEntity?.id,
  planCode: contract.plan?.code ?? '',
  isPlanRequired: !!contract.plan,
})
