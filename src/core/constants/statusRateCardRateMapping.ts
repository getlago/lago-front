import { StatusProps, StatusType } from '~/components/designSystem/Status'
import { RateCardRateStatusEnum } from '~/generated/graphql'

/**
 * A rate's status is derived server-side from the card's append-only timeline (future rate =
 * pending, latest effective = active, superseded = terminated), so a terminated rate is a normal
 * end of life rather than an incident: it reads as disabled, not danger (unlike subscriptions).
 */
export const rateCardRateStatusMapping = (status: RateCardRateStatusEnum): StatusProps => {
  switch (status) {
    case RateCardRateStatusEnum.Active:
      return { type: StatusType.success, label: 'active' }
    case RateCardRateStatusEnum.Terminated:
      return { type: StatusType.disabled, label: 'terminated' }
    default:
      return { type: StatusType.default, label: 'pending' }
  }
}
