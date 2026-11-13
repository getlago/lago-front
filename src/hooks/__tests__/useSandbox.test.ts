import { renderHook } from '@testing-library/react'

import { CurrentUserInfosFragment, OrganizationEnvironmentEnum } from '~/generated/graphql'
import { useSandbox } from '~/hooks/useSandbox'

const mockUseOrganizationInfos = jest.fn()
const mockUseLocation = jest.fn()
const mockUseCurrentUser = jest.fn()

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useLocation: () => mockUseLocation(),
}))

const PRODUCTION_SLUG = 'acme'
const PRODUCTION_ID = 'org-prod'

type MembershipOrganization = CurrentUserInfosFragment['memberships'][number]['organization']

type TestMembership = {
  organization: Pick<MembershipOrganization, 'id' | 'accessibleByCurrentSession'>
}

const setOrganization = (organization: Record<string, unknown> | undefined): void => {
  mockUseOrganizationInfos.mockReturnValue({ organization })
}

const setMemberships = (memberships: TestMembership[]): void => {
  mockUseCurrentUser.mockReturnValue({ currentUser: { memberships } })
}

const accessibleProductionMembership: TestMembership = {
  organization: { id: PRODUCTION_ID, accessibleByCurrentSession: true },
}

const setStrippedPathname = (strippedPathname: string, search = ''): void => {
  mockUseLocation.mockReturnValue({ strippedPathname, search })
}

describe('useSandbox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setMemberships([accessibleProductionMembership])
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
        productionOrganization: { id: PRODUCTION_ID, slug: PRODUCTION_SLUG },
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

    describe('WHEN the linked production organization is not accessible by the current session', () => {
      beforeEach(() => {
        setOrganization({
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization: { id: PRODUCTION_ID, slug: PRODUCTION_SLUG },
        })
        setStrippedPathname('/customers')
      })

      it('THEN should have no production path when the production membership is inaccessible', () => {
        setMemberships([{ organization: { id: PRODUCTION_ID, accessibleByCurrentSession: false } }])

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({ isSandbox: true, productionPath: null })
      })

      it('THEN should have no production path when the production organization is not in the memberships', () => {
        setMemberships([{ organization: { id: 'org-other', accessibleByCurrentSession: true } }])

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({ isSandbox: true, productionPath: null })
      })
    })

    describe('WHEN it has a linked production organization accessible by the current session', () => {
      beforeEach(() => {
        setOrganization({
          environment: OrganizationEnvironmentEnum.Sandbox,
          productionOrganization: { id: PRODUCTION_ID, slug: PRODUCTION_SLUG },
        })
        setMemberships([accessibleProductionMembership])
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

      it('THEN should keep the query string on a kept route', () => {
        setStrippedPathname('/settings/team-and-security/members', '?role=admin')

        const { result } = renderHook(() => useSandbox())

        expect(result.current).toEqual({
          isSandbox: true,
          productionPath: `/${PRODUCTION_SLUG}/settings/team-and-security/members?role=admin`,
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
