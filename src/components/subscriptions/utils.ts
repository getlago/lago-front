import { TSubscriptionUsageLifetimeGraphDataResult } from './SubscriptionUsageLifetimeGraph'

export const getLifetimeGraphPercentages = (
  lifetimeUsage?: TSubscriptionUsageLifetimeGraphDataResult,
): {
  nextThresholdPercentage: number
  lastThresholdPercentage: number
} => {
  if (!lifetimeUsage) {
    return {
      nextThresholdPercentage: 0,
      lastThresholdPercentage: 0,
    }
  }

  const localTotalUsageAmountCents = Number(lifetimeUsage.totalUsageAmountCents || 0)
  const localLastThresholdAmountCents = Number(lifetimeUsage.lastThresholdAmountCents || 0)
  const localNextThresholdAmountCents = Number(lifetimeUsage.nextThresholdAmountCents || 0)
  let localLastThresholdPercentage = 0
  let localNextThresholdPercentage = 0

  if (!localNextThresholdAmountCents) {
    localLastThresholdPercentage = 100
  } else {
    localLastThresholdPercentage =
      ((localTotalUsageAmountCents - localLastThresholdAmountCents) * 100) /
      (localNextThresholdAmountCents - localLastThresholdAmountCents)
    localNextThresholdPercentage = 100 - localLastThresholdPercentage
  }

  return {
    nextThresholdPercentage: localNextThresholdPercentage,
    lastThresholdPercentage: localLastThresholdPercentage,
  }
}
