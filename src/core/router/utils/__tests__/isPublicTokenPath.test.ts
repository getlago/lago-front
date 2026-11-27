import { generatePath } from 'react-router'

import { AGENT_CLAIM_ROUTE } from '~/core/router/paths/agentClaim'
import {
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_USAGE_ROUTE,
} from '~/core/router/paths/customerPortal'

import { isPublicTokenPath } from '../isPublicTokenPath'

const toPathname = (route: string): string =>
  generatePath(route, { token: 'a-portal-token', itemId: 'item-id', storefrontId: 'storefront-id' })

describe('isPublicTokenPath', () => {
  describe('GIVEN a public token pathname', () => {
    it.each([AGENT_CLAIM_ROUTE, CUSTOMER_PORTAL_ROUTE, CUSTOMER_PORTAL_USAGE_ROUTE])(
      'THEN %s is a public token path',
      (route) => {
        expect(isPublicTokenPath(toPathname(route))).toBe(true)
      },
    )

    it('THEN a trailing slash is still a public token path', () => {
      expect(isPublicTokenPath('/agent-claim/storefront-id/')).toBe(true)
    })
  })

  describe('GIVEN an admin or unknown pathname', () => {
    it.each([
      '/',
      '/login',
      '/acme/customers',
      '/acme/agent-claim/storefront-id',
      '/agent-claim',
      '/customer-portal',
      '',
    ])('THEN %s is not a public token path', (pathname) => {
      expect(isPublicTokenPath(pathname)).toBe(false)
    })
  })
})
