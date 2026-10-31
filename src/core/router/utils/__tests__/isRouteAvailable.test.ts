import { EventsStoreEnum, FeatureFlagEnum } from '~/generated/graphql'

import { isRouteGated, isRouteUnlocked } from '../isRouteAvailable'

const hasAccountTree = (flag: FeatureFlagEnum): boolean => flag === FeatureFlagEnum.AccountTree

describe('isRouteGated', () => {
  describe('GIVEN a route with no gate', () => {
    it('THEN should report it as ungated', () => {
      expect(isRouteGated({})).toBe(false)
    })
  })

  describe('GIVEN a gated route', () => {
    it.each([
      ['a feature flag', { featureFlag: FeatureFlagEnum.AccountTree }],
      ['a hiding feature flag', { hiddenWithFeatureFlag: FeatureFlagEnum.AccountTree }],
      ['a usage governance requirement', { requiresUsageGovernance: true }],
    ])('THEN should report a route gated by %s as gated', (_, route) => {
      expect(isRouteGated(route)).toBe(true)
    })
  })
})

describe('isRouteUnlocked', () => {
  describe('GIVEN a route gated by a feature flag only', () => {
    it.each([
      ['the flag is active', hasAccountTree, true],
      ['the flag is inactive', () => false, false],
    ])('THEN should return %s when %s', (_, hasFeatureFlag, expected) => {
      expect(
        isRouteUnlocked({
          route: { featureFlag: FeatureFlagEnum.AccountTree },
          hasFeatureFlag,
        }),
      ).toBe(expected)
    })
  })

  describe('GIVEN a route requiring usage governance', () => {
    const route = {
      featureFlag: FeatureFlagEnum.AccountTree,
      requiresUsageGovernance: true,
    }

    it.each([
      ['a clickhouse events store', EventsStoreEnum.Clickhouse, true],
      ['a postgres events store', EventsStoreEnum.Postgres, false],
    ])('THEN should return %s with %s', (_, eventsStore, expected) => {
      expect(
        isRouteUnlocked({ route, hasFeatureFlag: hasAccountTree, organization: { eventsStore } }),
      ).toBe(expected)
    })

    it('THEN should stay locked without an organization', () => {
      expect(isRouteUnlocked({ route, hasFeatureFlag: hasAccountTree })).toBe(false)
    })
  })
})
