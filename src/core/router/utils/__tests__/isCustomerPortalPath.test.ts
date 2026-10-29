import { generatePath } from 'react-router'

import {
  CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_USAGE_ROUTE,
  CUSTOMER_PORTAL_WALLET_ROUTE,
} from '~/core/router/paths/customerPortal'

import { isCustomerPortalPath } from '../isCustomerPortalPath'

const TOKEN = 'a-portal-token'

const toPathname = (route: string): string =>
  generatePath(route, { token: TOKEN, itemId: 'item-id', walletId: 'wallet-id' })

describe('isCustomerPortalPath', () => {
  describe('GIVEN a customer portal pathname', () => {
    it.each([
      CUSTOMER_PORTAL_ROUTE,
      CUSTOMER_PORTAL_USAGE_ROUTE,
      CUSTOMER_PORTAL_WALLET_ROUTE,
      CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
    ])('THEN %s is a portal path', (route) => {
      expect(isCustomerPortalPath(toPathname(route))).toBe(true)
    })

    it('THEN a trailing slash is still a portal path', () => {
      expect(isCustomerPortalPath(`/customer-portal/${TOKEN}/`)).toBe(true)
    })
  })

  describe('GIVEN an admin or unknown pathname', () => {
    it.each([
      '/',
      '/customers',
      '/acme/customers',
      '/acme/settings/taxes',
      // The portal is never mounted under an organization slug: a slug-prefixed
      // lookalike must not be granted the portal credentials.
      `/acme/customer-portal/${TOKEN}`,
      // No token means no portal session to scope credentials to.
      '/customer-portal',
      '',
    ])('THEN %s is not a portal path', (pathname) => {
      expect(isCustomerPortalPath(pathname)).toBe(false)
    })
  })
})
