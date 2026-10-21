import { FeatureFlagEnum } from '~/generated/graphql'

import {
  findOrganizationRoute,
  getOrganizationRouteRegistry,
  isOrganizationPathAvailable,
  isRouteEntryAvailable,
} from '../routeRegistry'

const noFeatureFlag = (): boolean => false
const withProductCatalog = (flag: FeatureFlagEnum): boolean =>
  flag === FeatureFlagEnum.ProductCatalog

describe('routeRegistry', () => {
  describe('getOrganizationRouteRegistry', () => {
    it('returns the same cached registry on subsequent calls', () => {
      expect(getOrganizationRouteRegistry()).toBe(getOrganizationRouteRegistry())
    })

    it('stores paths relative to the organization and leaves splat routes out', () => {
      const paths = getOrganizationRouteRegistry().map(({ path }) => path)

      expect(paths).toContain('customers')
      expect(paths).toContain('settings/taxes')
      expect(paths.some((path) => path.startsWith('/') || path.endsWith('*'))).toBe(false)
    })

    it('expands array paths into one entry each', () => {
      const paths = getOrganizationRouteRegistry().map(({ path }) => path)

      expect(paths).toContain('analytics')
      expect(paths).toContain('analytics/:tab')
    })
  })

  describe('findOrganizationRoute', () => {
    it('matches a concrete path against a dynamic route', () => {
      expect(findOrganizationRoute('/analytics/revenue-streams')?.path).toBe('analytics/:tab')
    })

    it('accepts paths with or without a leading slash', () => {
      expect(findOrganizationRoute('customers')?.path).toBe('customers')
      expect(findOrganizationRoute('/customers')?.path).toBe('customers')
    })

    it('returns undefined for an unknown path', () => {
      expect(findOrganizationRoute('/unknown-path')).toBeUndefined()
    })
  })

  describe('isOrganizationPathAvailable', () => {
    it('returns false for a path hidden by an active flag', () => {
      expect(isOrganizationPathAvailable('/analytics', withProductCatalog)).toBe(false)
    })

    it('returns true for the same path when the flag is not active', () => {
      expect(isOrganizationPathAvailable('/analytics', noFeatureFlag)).toBe(true)
    })

    it('returns false for a path requiring an inactive flag', () => {
      expect(isOrganizationPathAvailable('/contracts', noFeatureFlag)).toBe(false)
    })

    // Guards the Home redirect loop: an unknown path must not count as reachable.
    it('fails closed for an unknown path', () => {
      expect(isOrganizationPathAvailable('/unknown-path', noFeatureFlag)).toBe(false)
    })
  })

  describe('isRouteEntryAvailable', () => {
    it('returns false when an ancestor route is hidden by an active flag', () => {
      const entry = {
        path: 'child',
        route: {},
        ancestors: [{ hiddenWithFeatureFlag: FeatureFlagEnum.ProductCatalog }],
      }

      expect(isRouteEntryAvailable(entry, withProductCatalog)).toBe(false)
      expect(isRouteEntryAvailable(entry, noFeatureFlag)).toBe(true)
    })
  })
})
