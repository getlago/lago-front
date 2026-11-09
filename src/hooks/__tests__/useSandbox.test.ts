import { renderHook } from '@testing-library/react'

import { OrganizationEnvironmentEnum } from '~/generated/graphql'
import { useSandbox } from '~/hooks/useSandbox'

const mockUseOrganizationInfos = jest.fn()
const mockUseLocation = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useLocation: () => mockUseLocation(),
}))

const PRODUCTION_SLUG = 'acme'

const setOrganization = (organization: Record<string, unknown> | undefined): void => {
  mockUseOrganizationInfos.mockReturnValue({ organization })
}

const setStrippedPathname = (strippedPathname: string): void => {
  mockUseLocation.mockReturnValue({ strippedPathname })
}

describe('useSandbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the organization is not loaded yet', () => {
    it('THEN should not be a sandbox and have no production path', () => {
      setOrganization(undefined)
      setStrippedPathname('/customers')

      const { result } = renderHook(() => useSandbox())

      expect(result.current).toEqual({ isSandbox: false, productionPath: null })
    })
  })

  describe('GIVEN a production organization', () => {
    it('THEN should not be a sandbox and have no production path', () => {
      setOrganization({
        environment: OrganizationEnvironmentEnum.Production,
        productionOrganization: { id: 'org-prod', slug: PRODUCTION_SLUG },
      })
      setStrippedPathname('/customers')

      const { result } = renderHook(() => useSandbox())

      expect(result.current).toEqual({ isSandbox: false, productionPath: null })
    })
  })

  describe('GIVEN a sandbox organization', () => {
    describe('WHEN it has no linked production organization', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
      ])('THEN should have no production path when the link is %s', (_, productionOrganization) => {
        setOrganization({
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization,
        })
        setStrippedPathname('/customers')

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({ isSandbox: true, productionPath: null })
      })
    })

    describe('WHEN it has a linked production organization', () => {
      beforeEach(() => {
        setOrganization({
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization: { id: 'org-prod', slug: PRODUCTION_SLUG },
        })
      })

      it.each([
        ['a static route', '/customers'],
        ['a nested static route', '/settings/taxes'],
        ['a route with view params (:group/:tab)', '/settings/team-and-security/members'],
        ['a route with a view param (:tab)', '/analytics/invoices'],
      ])('THEN should keep the current path on %s', (_, strippedPathname) => {
        setStrippedPathname(strippedPathname)

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({
          isSandbox: true,
          productionPath: `/${PRODUCTION_SLUG}${strippedPathname}`,
        })
      })

      it.each([
        ['a route with a resource param (:customerId)', '/customer/customer-123'],
        ['an unknown route', '/this-route-does-not-exist'],
      ])('THEN should fall back to the production home on %s', (_, strippedPathname) => {
        setStrippedPathname(strippedPathname)

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({
          isSandbox: true,
          productionPath: `/${PRODUCTION_SLUG}/`,
        })
      })
    })
  })
})
