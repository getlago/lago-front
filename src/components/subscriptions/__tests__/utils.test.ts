import { getLifetimeGraphPercentages } from '~/components/subscriptions/utils'
import { SubscriptionLifetimeUsage } from '~/generated/graphql'

describe('subscriptions utils tests', () => {
  it('should return the appropriate calculated percentages', () => {
    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '100',
        lastThresholdAmountCents: '100',
        nextThresholdAmountCents: '200',
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      nextThresholdPercentage: 100,
      lastThresholdPercentage: 0,
    })

    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '200',
        lastThresholdAmountCents: '100',
        nextThresholdAmountCents: '200',
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      nextThresholdPercentage: 0,
      lastThresholdPercentage: 100,
    })

    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '150000',
        lastThresholdAmountCents: '100000',
        nextThresholdAmountCents: '300000',
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      lastThresholdPercentage: 25,
      nextThresholdPercentage: 75,
    })

    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '150000',
        lastThresholdAmountCents: '100000',
        nextThresholdAmountCents: '450000',
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      lastThresholdPercentage: 14.285714285714286,
      nextThresholdPercentage: 85.71428571428571,
    })

    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '150000',
        lastThresholdAmountCents: '100000',
        nextThresholdAmountCents: null,
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      lastThresholdPercentage: 100,
      nextThresholdPercentage: 0,
    })

    expect(
      getLifetimeGraphPercentages({
        totalUsageAmountCents: '150000',
        lastThresholdAmountCents: '100000',
        nextThresholdAmountCents: '0',
      } as SubscriptionLifetimeUsage),
    ).toEqual({
      lastThresholdPercentage: 100,
      nextThresholdPercentage: 0,
    })
  })
})
