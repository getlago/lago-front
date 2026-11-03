import { renderHook } from '@testing-library/react'

import { EventsStoreEnum, FeatureFlagEnum } from '~/generated/graphql'

import { useRolePermissionsGroups } from '../useRolePermissionsGroups'

const mockFeatureFlags = new Set<FeatureFlagEnum>()
let mockOrganizationLoading = false
let mockEventsStore = EventsStoreEnum.Clickhouse

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    loading: mockOrganizationLoading,
    organization: mockOrganizationLoading
      ? undefined
      : { featureFlags: Array.from(mockFeatureFlags), eventsStore: mockEventsStore },
    hasFeatureFlag: (flag: FeatureFlagEnum) => mockFeatureFlags.has(flag),
  }),
}))

const GOVERNANCE_GROUP_ID = 'usageAttributionTypes'
const PRODUCT_CATALOG_HIDDEN_GROUP_IDS = [
  'addons',
  'charges',
  'coupons',
  'dunningCampaigns',
  'features',
  'subscriptions',
  'wallets',
]

describe('useRolePermissionsGroups', () => {
  beforeEach(() => {
    mockFeatureFlags.clear()
    mockOrganizationLoading = false
    mockEventsStore = EventsStoreEnum.Clickhouse
  })

  describe('GIVEN the organization is still loading', () => {
    it('THEN it reports loading so callers do not render the flag-less permission set', () => {
      mockOrganizationLoading = true

      const { result } = renderHook(() => useRolePermissionsGroups())

      expect(result.current.isLoading).toBe(true)
    })
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

  describe('GIVEN the product catalog feature flag is disabled', () => {
    it('THEN it hides the products, rate cards and contracts groups', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())
      const groupIds = result.current.groups.map((group) => group.id)

      expect(groupIds).not.toContain('products')
      expect(groupIds).not.toContain('rateCards')
      expect(groupIds).not.toContain('contracts')
    })

    it('THEN it keeps the groups the product catalog replaces', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())
      const groupIds = result.current.groups.map((group) => group.id)

      expect(groupIds).toEqual(expect.arrayContaining(PRODUCT_CATALOG_HIDDEN_GROUP_IDS))
    })
  })

  describe('GIVEN the product catalog feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureFlags.add(FeatureFlagEnum.ProductCatalog)
    })

    it('THEN it exposes the products, rate cards and contracts groups', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())
      const groups = result.current.groups

      expect(groups.find((group) => group.id === 'products')?.items.map((item) => item.id)).toEqual(
        ['ProductsCreate', 'ProductsDelete', 'ProductsUpdate', 'ProductsView'],
      )
      expect(groups.find((group) => group.id === 'rateCards')).toBeDefined()
      expect(groups.find((group) => group.id === 'contracts')).toBeDefined()
    })

    it('THEN it keeps the AI agent and quotes groups, whose features stay live', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())
      const groupIds = result.current.groups.map((group) => group.id)

      expect(groupIds).toEqual(expect.arrayContaining(['aiAgent', 'quotes']))
    })

    it('THEN it hides the groups the product catalog replaces', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())
      const groupIds = result.current.groups.map((group) => group.id)

      PRODUCT_CATALOG_HIDDEN_GROUP_IDS.forEach((groupId) => {
        expect(groupIds).not.toContain(groupId)
      })
    })

    it('THEN it does not move the hidden permissions to the other group', () => {
      const { result } = renderHook(() => useRolePermissionsGroups())

      const otherItemIds =
        result.current.groups.find((group) => group.id === 'other')?.items.map((item) => item.id) ??
        []

      expect(otherItemIds).not.toEqual(expect.arrayContaining(['AddonsView']))
      expect(otherItemIds).not.toEqual(expect.arrayContaining(['WalletsCreate']))
    })
  })
})
