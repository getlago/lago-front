import { renderHook } from '@testing-library/react'

import { EventsStoreEnum, FeatureFlagEnum } from '~/generated/graphql'

import { useRolePermissionsGroups } from '../useRolePermissionsGroups'

const mockFeatureFlags = new Set<FeatureFlagEnum>()
let mockEventsStore = EventsStoreEnum.Clickhouse

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { eventsStore: mockEventsStore },
    hasFeatureFlag: (flag: FeatureFlagEnum) => mockFeatureFlags.has(flag),
  }),
}))

const GOVERNANCE_GROUP_ID = 'usageAttributionTypes'

describe('useRolePermissionsGroups', () => {
  beforeEach(() => {
    mockFeatureFlags.clear()
    mockEventsStore = EventsStoreEnum.Clickhouse
  })

  describe('GIVEN the account tree feature flag is disabled', () => {
    it('THEN it hides the governance group entirely', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())

      expect(
        result.current.groups.find((group) => group.id === GOVERNANCE_GROUP_ID),
      ).toBeUndefined()
    })

    it('THEN it still exposes the ungated groups', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())

      expect(result.current.groups.find((group) => group.id === 'addons')).toBeDefined()
    })
  })

  describe('GIVEN the account tree flag is enabled on a Postgres events store', () => {
    it('THEN it hides the governance group entirely', () => {
      mockFeatureFlags.add(FeatureFlagEnum.AccountTree)
      mockEventsStore = EventsStoreEnum.Postgres

      const { result } = renderHook(() => useRolePermissionsGroups())

      expect(
        result.current.groups.find((group) => group.id === GOVERNANCE_GROUP_ID),
      ).toBeUndefined()
    })
  })

  describe('GIVEN the account tree feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureFlags.add(FeatureFlagEnum.AccountTree)
    })

    it('THEN it exposes the governance group with its five permissions', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())

      const governanceGroup = result.current.groups.find(
        (group) => group.id === GOVERNANCE_GROUP_ID,
      )

      expect(governanceGroup?.items.map((item) => item.id)).toEqual([
        'AttributedUsageView',
        'UsageAttributionTypesCreate',
        'UsageAttributionTypesDelete',
        'UsageAttributionTypesUpdate',
        'UsageAttributionTypesView',
      ])
    })
  })
})
