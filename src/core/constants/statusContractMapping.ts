import { StatusProps, StatusType } from '~/components/designSystem/Status'
import { ContractStatusEnum } from '~/generated/graphql'

export const contractStatusMapping = (status?: ContractStatusEnum | null): StatusProps => {
  switch (status) {
    case ContractStatusEnum.Active:
      return { type: StatusType.success, label: 'active' }
    case ContractStatusEnum.Canceled:
      return { type: StatusType.disabled, label: 'canceled' }
    case ContractStatusEnum.Terminated:
      return { type: StatusType.danger, label: 'terminated' }
    default:
      return { type: StatusType.default, label: 'pending' }
  }
}
