import { generatePath } from 'react-router'

import {
  CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_USAGE_ROUTE,
  CUSTOMER_PORTAL_WALLET_ROUTE,
} from '~/core/router/paths/customerPortal'

import { getCustomerPortalToken } from '../getCustomerPortalToken'

const TOKEN = 'a-portal-token'

const toPathname = (route: string): string =>
  generatePath(route, { token: TOKEN, itemId: 'item-id', walletId: 'wallet-id' })

describe('getCustomerPortalToken', () => {
  describe('GIVEN a customer portal pathname', () => {
    it.each([
      CUSTOMER_PORTAL_ROUTE,
      CUSTOMER_PORTAL_USAGE_ROUTE,
      CUSTOMER_PORTAL_WALLET_ROUTE,
      CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
    ])('THEN %s resolves to the token it carries', (route) => {
      expect(getCustomerPortalToken(toPathname(route))).toBe(TOKEN)
    })

    it('THEN a trailing slash still resolves the token', () => {
      expect(getCustomerPortalToken(`/customer-portal/${TOKEN}/`)).toBe(TOKEN)
    })

    it('THEN two portals resolve to their own token', () => {
      expect(getCustomerPortalToken('/customer-portal/token-x')).toBe('token-x')
      expect(getCustomerPortalToken('/customer-portal/token-y/usage/item-id')).toBe('token-y')
    })

    it('THEN a JWT-shaped token survives untouched', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjdXN0b21lci14In0.s1gn-4tur3_v4lu3'

      expect(getCustomerPortalToken(`/customer-portal/${jwt}/wallet/wallet-id`)).toBe(jwt)
    })
  })

  describe('GIVEN an admin or unknown pathname', () => {
    it.each([
      '/',
      '/customers',
      '/acme/customers',
      // The portal is never mounted under an organization slug: a slug-prefixed
      // lookalike must not resolve a token.
      `/acme/customer-portal/${TOKEN}`,
      '/customer-portal',
      '',
    ])('THEN %s resolves no token', (pathname) => {
      expect(getCustomerPortalToken(pathname)).toBeUndefined()
    })
  })
})
