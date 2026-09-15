import {
  ConnectionBehaviorEnum,
  ConnectionCategoryEnum,
  ConnectionResolvedBehaviorEnum,
} from '~/generated/graphql'

import { SelectedConnection } from './types'

type ConnectionRoutingRow = {
  category: ConnectionCategoryEnum
  behavior: ConnectionResolvedBehaviorEnum
  code?: string | null
}

export const findPaymentRouting = <T extends ConnectionRoutingRow>(
  connections: T[] | null | undefined,
): T | undefined =>
  connections?.find((routing) => routing.category === ConnectionCategoryEnum.Payment)

/**
 * `inherit` carries the customer default's code, so reading `code` without branching on
 * `behavior` would turn an inherited routing into an explicit override on the next save.
 */
export const toSelectedConnection = (
  routing: ConnectionRoutingRow | undefined,
): SelectedConnection => {
  if (routing?.behavior === ConnectionResolvedBehaviorEnum.Skip) {
    return { behavior: ConnectionBehaviorEnum.Skip }
  }

  if (routing?.behavior === ConnectionResolvedBehaviorEnum.Specific && routing.code) {
    return { code: routing.code }
  }

  return undefined
}
