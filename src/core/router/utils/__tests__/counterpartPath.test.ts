import { getCounterpartPath } from '../counterpartPath'

const TARGET_SLUG = 'acme'

describe('getCounterpartPath', () => {
  it.each([
    ['a static route', '/customers'],
    ['a nested static route', '/settings/taxes'],
    ['a route with view params (:group/:tab)', '/settings/team-and-security/members'],
    ['a route with a view param (:tab)', '/analytics/invoices'],
  ])('keeps the current path on %s', (_, strippedPathname) => {
    expect(getCounterpartPath({ targetSlug: TARGET_SLUG, strippedPathname })).toBe(
      `/${TARGET_SLUG}${strippedPathname}`,
    )
  })

  it('keeps the query string on a kept route', () => {
    expect(
      getCounterpartPath({
        targetSlug: TARGET_SLUG,
        strippedPathname: '/settings/team-and-security/members',
        search: '?role=admin',
      }),
    ).toBe(`/${TARGET_SLUG}/settings/team-and-security/members?role=admin`)
  })

  it.each([
    ['a route with a resource param (:customerId)', '/customer/customer-123'],
    ['an unknown route', '/this-route-does-not-exist'],
  ])(
    'falls back to the home of the target on %s, without the query string',
    (_, strippedPathname) => {
      expect(
        getCounterpartPath({ targetSlug: TARGET_SLUG, strippedPathname, search: '?role=admin' }),
      ).toBe(`/${TARGET_SLUG}/`)
    },
  )
})
