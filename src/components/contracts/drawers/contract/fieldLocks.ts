import { ContractStatusEnum } from '~/generated/graphql'

export type ContractFieldLocks = {
  planCode: boolean
  externalId: boolean
  startedAt: boolean
  billingAnchorDate: boolean
}

export const CREATE_CONTRACT_FIELD_LOCKS: ContractFieldLocks = {
  planCode: false,
  externalId: false,
  startedAt: false,
  billingAnchorDate: false,
}

// `Contracts::UpdateService`: `externalId` is the lookup key, and an active contract only
// accepts `EDITABLE_WHILE_ACTIVE` changes.
export const getContractFieldLocks = (status?: ContractStatusEnum | null): ContractFieldLocks => {
  if (!status) return CREATE_CONTRACT_FIELD_LOCKS
  if (status === ContractStatusEnum.Pending) {
    return { ...CREATE_CONTRACT_FIELD_LOCKS, externalId: true }
  }

  return { planCode: true, externalId: true, startedAt: true, billingAnchorDate: true }
}
