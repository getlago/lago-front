import { isSafeInAppPath } from '../isSafeInAppPath'

describe('isSafeInAppPath', () => {
  describe('GIVEN an absolute same-origin in-app path', () => {
    it.each([
      '/',
      '/customers',
      '/acme/customers',
      '/acme/plans/123?tab=overview#section',
      '/acme/customers/id-with-%2F-encoded-slash',
    ])('THEN %s is safe', (path) => {
      expect(isSafeInAppPath(path)).toBe(true)
    })
  })

  describe('GIVEN a protocol-relative or backslash-tricked path', () => {
    it.each([
      '//evil.com',
      '///evil.com',
      '/\\evil.com',
      '\\/evil.com',
      '\\\\evil.com',
      '/acme/\\evil.com',
    ])('THEN %s is rejected', (path) => {
      expect(isSafeInAppPath(path)).toBe(false)
    })
  })

  describe('GIVEN a scheme-qualified URL', () => {
    it.each(['https://evil.com', 'http://evil.com', 'javascript:alert(1)//', 'mailto:a@b.co'])(
      'THEN %s is rejected',
      (path) => {
        expect(isSafeInAppPath(path)).toBe(false)
      },
    )
  })

  describe('GIVEN a non-absolute value', () => {
    it.each(['', 'customers', './customers', '../customers', '#anchor', '?tab=1'])(
      'THEN %s is rejected',
      (path) => {
        expect(isSafeInAppPath(path)).toBe(false)
      },
    )
  })
})
