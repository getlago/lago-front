import { StatusTypeEnum } from '~/generated/graphql'

/**
 * Checks if a subscription can be edited/terminated based on its status.
 * A subscription is editable when it's not already terminated or canceled.
 */
export const isSubscriptionEditable = (status: StatusTypeEnum | null | undefined): boolean => {
  if (!status) return false

  return status !== StatusTypeEnum.Terminated && status !== StatusTypeEnum.Canceled
}
