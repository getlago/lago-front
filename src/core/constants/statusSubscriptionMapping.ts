import { StatusProps, StatusType } from '~/components/designSystem/Status'
import { StatusTypeEnum } from '~/generated/graphql'

/**
 * Tells whether ending a subscription in this status is a cancellation rather than a
 * termination. Pending and incomplete subscriptions never started billing, so there is
 * nothing to invoice or credit when they end.
 *
 * Callers use it both to word the action ("Cancel subscription" instead of "Terminate
 * subscription") and to pick the plain confirmation dialog over the invoice form.
 */
export const isSubscriptionCancellation = (status?: StatusTypeEnum | null): boolean =>
  status === StatusTypeEnum.Pending || status === StatusTypeEnum.Incomplete

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
    case StatusTypeEnum.Incomplete:
      return {
        type: StatusType.warning,
        label: 'incomplete',
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
