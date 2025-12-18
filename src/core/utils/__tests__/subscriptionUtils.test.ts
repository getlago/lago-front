import { StatusTypeEnum } from '~/generated/graphql'

import { isSubscriptionEditable } from '../subscriptionUtils'

describe('subscriptionUtils', () => {
  describe('isSubscriptionEditable', () => {
    it('should return true for active subscription', () => {
      expect(isSubscriptionEditable(StatusTypeEnum.Active)).toBe(true)
    })

    it('should return true for pending subscription', () => {
      expect(isSubscriptionEditable(StatusTypeEnum.Pending)).toBe(true)
    })

    it('should return false for terminated subscription', () => {
      expect(isSubscriptionEditable(StatusTypeEnum.Terminated)).toBe(false)
    })

    it('should return false for canceled subscription', () => {
      expect(isSubscriptionEditable(StatusTypeEnum.Canceled)).toBe(false)
    })

    it('should return false for null status', () => {
      expect(isSubscriptionEditable(null)).toBe(false)
    })

    it('should return false for undefined status', () => {
      expect(isSubscriptionEditable(undefined)).toBe(false)
    })
  })
})
