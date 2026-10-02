import { ContractStatusEnum } from '~/generated/graphql'

export type ContractFieldLocks = {
  planCode: boolean
  startedAt: boolean
  billingAnchorDate: boolean
}

const ALL_UNLOCKED: ContractFieldLocks = {
  planCode: false,
  startedAt: false,
  billingAnchorDate: false,
}

// `Contracts::UpdateService`: an active contract only accepts `EDITABLE_WHILE_ACTIVE` changes,
// which excludes the plan, start date and billing anchor.
export const getContractFieldLocks = (status: ContractStatusEnum): ContractFieldLocks =>
  status === ContractStatusEnum.Active
    ? { planCode: true, startedAt: true, billingAnchorDate: true }
    : ALL_UNLOCKED
