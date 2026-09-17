import { StatusProps, StatusType } from '~/components/designSystem/Status'
import { RateCardRateStatusEnum } from '~/generated/graphql'

// A superseded rate is a normal end of life, not an incident: disabled, not danger like a
// terminated subscription.
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
