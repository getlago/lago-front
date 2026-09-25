import { renderHook } from '@testing-library/react'

import { FeatureFlagEnum } from '~/generated/graphql'

import { useRolePermissionsGroups } from '../useRolePermissionsGroups'

const mockFeatureFlags = new Set<FeatureFlagEnum>()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: (flag: FeatureFlagEnum) => mockFeatureFlags.has(flag),
  }),
}))

const GOVERNANCE_GROUP_ID = 'usageAttributionTypes'

describe('useRolePermissionsGroups', () => {
  beforeEach(() => {
    mockFeatureFlags.clear()
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

  describe('GIVEN the account tree feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureFlags.add(FeatureFlagEnum.AccountTree)
    })

    it('THEN it exposes the governance group with its four permissions', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())

      const governanceGroup = result.current.groups.find(
        (group) => group.id === GOVERNANCE_GROUP_ID,
      )

      expect(governanceGroup?.items.map((item) => item.id)).toEqual([
        'UsageAttributionTypesCreate',
        'UsageAttributionTypesDelete',
        'UsageAttributionTypesUpdate',
        'UsageAttributionTypesView',
      ])
    })
  })
})
