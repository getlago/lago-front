import { FeatureFlagEnum } from '~/generated/graphql'

import {
  getPermissionRouteMap,
  getRouteForPermission,
  isRoutePathAvailable,
} from '../permissionRouteMap'

const noFeatureFlag = (): boolean => false
const withProductCatalog = (flag: FeatureFlagEnum): boolean =>
  flag === FeatureFlagEnum.ProductCatalog

describe('permissionRouteMap', () => {
  describe('getPermissionRouteMap', () => {
    it('returns a map of view permissions to routes', () => {
      const map = getPermissionRouteMap()

      expect(map).toBeDefined()
      expect(typeof map).toBe('object')
    })

    it('returns the same cached map on subsequent calls', () => {
      const map1 = getPermissionRouteMap()
      const map2 = getPermissionRouteMap()

      expect(map1).toBe(map2)
    })

    it('only includes routes without dynamic params', () => {
      const map = getPermissionRouteMap()

      for (const candidates of Object.values(map)) {
        for (const { path } of candidates ?? []) {
          expect(path).not.toContain(':')
        }
      }
    })
  })

  describe('getRouteForPermission', () => {
    it('returns the relative route for a view permission (paths under :organizationSlug)', () => {
      expect(getRouteForPermission('customersView', noFeatureFlag)).toBe('customers')
      expect(getRouteForPermission('billableMetricsView', noFeatureFlag)).toBe('billable-metrics')
      expect(getRouteForPermission('plansView', noFeatureFlag)).toBe('plans')
      expect(getRouteForPermission('couponsView', noFeatureFlag)).toBe('coupons')
      expect(getRouteForPermission('addonsView', noFeatureFlag)).toBe('add-ons')
      expect(getRouteForPermission('invoicesView', noFeatureFlag)).toBe('invoices')
      expect(getRouteForPermission('paymentsView', noFeatureFlag)).toBe('payments')
      expect(getRouteForPermission('creditNotesView', noFeatureFlag)).toBe('credit-notes')
      expect(getRouteForPermission('subscriptionsView', noFeatureFlag)).toBe('subscriptions')
      expect(getRouteForPermission('featuresView', noFeatureFlag)).toBe('features')
    })

    it('returns settings routes (relative paths)', () => {
      expect(getRouteForPermission('organizationInvoicesView', noFeatureFlag)).toBe(
        'settings/invoice-sections',
      )
      expect(getRouteForPermission('organizationTaxesView', noFeatureFlag)).toBe('settings/taxes')
      expect(getRouteForPermission('organizationMembersView', noFeatureFlag)).toBe(
        'settings/team-and-security',
      )
      expect(getRouteForPermission('dunningCampaignsView', noFeatureFlag)).toBe('settings/dunnings')
    })

    it('returns null for non-view permissions', () => {
      expect(getRouteForPermission('customersCreate', noFeatureFlag)).toBeNull()
      expect(getRouteForPermission('plansDelete', noFeatureFlag)).toBeNull()
    })

    it('returns null for permissions without associated routes', () => {
      // auditLogsView doesn't have a standalone route in the current config
      expect(getRouteForPermission('auditLogsView', noFeatureFlag)).toBeNull()
    })

    it('returns null for a null permission', () => {
      expect(getRouteForPermission(null, noFeatureFlag)).toBeNull()
    })

    describe('GIVEN the product catalog flag is active', () => {
      it('THEN skips routes hidden by the flag and falls back to an available one', () => {
        expect(getRouteForPermission('plansView', withProductCatalog)).toBe('plan-pricing')
      })

      it('THEN returns null when every route of the permission is hidden', () => {
        expect(getRouteForPermission('couponsView', withProductCatalog)).toBeNull()
        expect(getRouteForPermission('addonsView', withProductCatalog)).toBeNull()
        expect(getRouteForPermission('dunningCampaignsView', withProductCatalog)).toBeNull()
      })
    })

    describe('GIVEN the product catalog flag is not active', () => {
      it('THEN skips routes requiring the flag', () => {
        expect(getRouteForPermission('contractsView', noFeatureFlag)).toBeNull()
      })
    })
  })

  describe('isRoutePathAvailable', () => {
    it('returns false for a path hidden by an active flag', () => {
      expect(isRoutePathAvailable('/analytics', withProductCatalog)).toBe(false)
    })

    it('returns true for the same path when the flag is not active', () => {
      expect(isRoutePathAvailable('/analytics', noFeatureFlag)).toBe(true)
    })

    it('returns true for an unknown path', () => {
      expect(isRoutePathAvailable('/unknown-path', withProductCatalog)).toBe(true)
    })
  })
})
