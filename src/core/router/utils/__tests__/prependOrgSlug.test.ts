import { prependOrgSlug } from '../prependOrgSlug'

describe('prependOrgSlug', () => {
  describe('GIVEN a valid organization slug and an absolute path', () => {
    describe('WHEN the path is a standard in-app route', () => {
      it.each([
        ['/customers', '/acme/customers'],
        ['/plans/123', '/acme/plans/123'],
        ['/settings/taxes', '/acme/settings/taxes'],
      ])('THEN should prepend the slug to %s', (input, expected) => {
        expect(prependOrgSlug(input, 'acme')).toBe(expected)
      })
    })
  })

  describe('GIVEN no organization slug', () => {
    describe('WHEN slug is undefined', () => {
      it('THEN should return the path unchanged', () => {
        expect(prependOrgSlug('/customers', undefined)).toBe('/customers')
      })
    })

    describe('WHEN slug is empty string', () => {
      it('THEN should return the path unchanged', () => {
        expect(prependOrgSlug('/customers', '')).toBe('/customers')
      })
    })
  })

  describe('GIVEN the path is not absolute', () => {
    it.each([
      ['customers', 'customers'],
      ['./customers', './customers'],
      ['', ''],
    ])('THEN should return "%s" unchanged', (input, expected) => {
      expect(prependOrgSlug(input, 'acme')).toBe(expected)
    })
  })

  describe('GIVEN the path is the root "/"', () => {
    describe('WHEN navigating to HOME_ROUTE', () => {
      it('THEN should return "/" unchanged', () => {
        expect(prependOrgSlug('/', 'acme')).toBe('/')
      })
    })
  })

  describe('GIVEN the path is already slug-prefixed', () => {
    describe('WHEN the path starts with /{slug}/', () => {
      it('THEN should not double-prepend', () => {
        expect(prependOrgSlug('/acme/customers', 'acme')).toBe('/acme/customers')
      })
    })

    describe('WHEN the path is exactly /{slug}', () => {
      it('THEN should not double-prepend', () => {
        expect(prependOrgSlug('/acme', 'acme')).toBe('/acme')
      })
    })
  })

  describe('GIVEN the path starts with a NEVER_SLUG_PREFIX', () => {
    it.each([
      ['/customer-portal', '/customer-portal'],
      ['/customer-portal/invoices', '/customer-portal/invoices'],
      ['/forbidden', '/forbidden'],
      ['/404', '/404'],
      ['/login', '/login'],
      ['/login/okta', '/login/okta'],
    ])('THEN should return "%s" unchanged', (input, expected) => {
      expect(prependOrgSlug(input, 'acme')).toBe(expected)
    })
  })

  describe('GIVEN a hostile off-origin path', () => {
    const ORIGIN = 'https://app.lago.dev'

    // Absolute, so the helper prefixes them. These are the cases whose
    // same-origin outcome depends on downstream normalisation.
    const ABSOLUTE_HOSTILE = ['//evil.com', '///evil.com', '/\\evil.com']

    // Not absolute, so the helper returns them untouched whether or not a slug
    // is present. `prependOrgSlug` is not a validator.
    const PASS_THROUGH_HOSTILE = [
      '\\/evil.com',
      '\\\\evil.com',
      'https://evil.com',
      'javascript:alert(1)//',
    ]

    describe('WHEN an org slug is present and the path is absolute', () => {
      // Pins the property, not the string: `//evil.com` becomes
      // `/acme//evil.com`, which is same-origin only because the leading
      // `/acme` stops it being read as protocol-relative. v7.18 widened the
      // regex that classifies exactly these shapes.
      it.each(ABSOLUTE_HOSTILE)('THEN the result stays same-origin for %s', (input) => {
        expect(new URL(prependOrgSlug(input, 'acme'), ORIGIN).origin).toBe(ORIGIN)
      })
    })

    describe('WHEN the path is not absolute', () => {
      // Characterization, not endorsement. These survive the helper unchanged
      // and resolve off-origin. Safe today only because no untrusted value
      // reaches a `navigate()` or `<Link to>`; `isSafeInAppPath` is what makes
      // that a guarantee rather than an audit.
      it.each(PASS_THROUGH_HOSTILE)('THEN %s is returned unchanged, with a slug', (input) => {
        expect(prependOrgSlug(input, 'acme')).toBe(input)
      })
    })

    describe('WHEN no org slug is present', () => {
      // With no slug the helper is a pass-through for every shape, absolute
      // included, so an off-origin value survives.
      it.each([...ABSOLUTE_HOSTILE, ...PASS_THROUGH_HOSTILE])(
        'THEN %s is returned unchanged',
        (input) => {
          expect(prependOrgSlug(input, undefined)).toBe(input)
        },
      )
    })
  })
})
