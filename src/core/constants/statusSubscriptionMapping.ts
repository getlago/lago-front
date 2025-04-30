import { StatusProps, StatusType } from '~/components/designSystem'
import { StatusTypeEnum } from '~/generated/graphql'

export const subscriptionStatusMapping = (status?: StatusTypeEnum | null): StatusProps => {
  switch (status) {
    case StatusTypeEnum.Active:
      return {
        type: StatusType.success,
        label: 'active',
      }
    case StatusTypeEnum.Pending:
      return {
        type: StatusType.default,
        label: 'pending',
      }
    case StatusTypeEnum.Canceled:
      return {
        type: StatusType.disabled,
        label: 'canceled',
      }
    case StatusTypeEnum.Terminated:
      return {
        type: StatusType.danger,
        label: 'terminated',
      }
    default:
      return {
        type: StatusType.default,
        label: 'pending',
      }
  }
}
