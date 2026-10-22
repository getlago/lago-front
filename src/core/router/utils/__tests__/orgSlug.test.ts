import { OrgSlugResolverDataFragment } from '~/generated/graphql'

import {
  ensureSlugPrefix,
  findRefusedOrganization,
  getAccessibleMemberships,
  isAccessibleOrgSlug,
  pathHasValidSlug,
  pathTargetsInaccessibleOrg,
  resolveOrgSlug,
} from '../orgSlug'

const mockGetCurrentOrganizationId = jest.fn()
const mockGetPersistedOrganizationSlug = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  getCurrentOrganizationId: () => mockGetCurrentOrganizationId(),
  getPersistedOrganizationSlug: () => mockGetPersistedOrganizationSlug(),
}))

type CurrentUser = OrgSlugResolverDataFragment | undefined

const buildCurrentUser = (
  memberships: OrgSlugResolverDataFragment['memberships'],
): CurrentUser => ({
  memberships,
})

const defaultMemberships: OrgSlugResolverDataFragment['memberships'] = [
  {
    id: 'm-1',
    organization: { id: 'org-a', slug: 'org-a', accessibleByCurrentSession: true },
  },
  {
    id: 'm-2',
    organization: { id: 'org-b', slug: 'org-b', accessibleByCurrentSession: true },
  },
]

describe('resolveOrgSlug', () => {
  beforeEach(() => {
    mockGetCurrentOrganizationId.mockClear()
    mockGetPersistedOrganizationSlug.mockClear()
    mockGetPersistedOrganizationSlug.mockReturnValue(null)
  })

  describe('GIVEN a user with memberships and a matching current org ID', () => {
    it('THEN should return the slug of the matching organization', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-b')

      const result = resolveOrgSlug(buildCurrentUser(defaultMemberships))

      expect(result).toBe('org-b')
    })
  })

  describe('GIVEN no current org ID (e.g. hard reload) but a persisted last-used slug', () => {
    it('THEN should recover to the persisted org slug, not memberships[0]', () => {
      mockGetCurrentOrganizationId.mockReturnValue(undefined)
      mockGetPersistedOrganizationSlug.mockReturnValue('org-b')

      const result = resolveOrgSlug(buildCurrentUser(defaultMemberships))

      expect(result).toBe('org-b')
    })
  })

  describe('GIVEN the in-memory current org and the persisted slug differ', () => {
    it('THEN should prefer the in-memory current org (per-tab, multi-tab safe)', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-a')
      mockGetPersistedOrganizationSlug.mockReturnValue('org-b')

      const result = resolveOrgSlug(buildCurrentUser(defaultMemberships))

      expect(result).toBe('org-a')
    })
  })

  describe('GIVEN a user with memberships but no matching current org ID', () => {
    it('THEN should fallback to the first membership slug', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-nonexistent')

      const result = resolveOrgSlug(buildCurrentUser(defaultMemberships))

      expect(result).toBe('org-a')
    })
  })

  describe('GIVEN a user with memberships and no current org ID nor persisted slug', () => {
    it('THEN should fallback to the first membership slug', () => {
      mockGetCurrentOrganizationId.mockReturnValue(undefined)

      const result = resolveOrgSlug(buildCurrentUser(defaultMemberships))

      expect(result).toBe('org-a')
    })
  })

  describe('GIVEN some memberships the current session cannot access', () => {
    const lockedOrgA = {
      ...defaultMemberships[0],
      organization: { ...defaultMemberships[0].organization, accessibleByCurrentSession: false },
    }
    const lockedOrgB = {
      ...defaultMemberships[1],
      organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
    }

    it('THEN should skip an inaccessible in-memory current org', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-a')

      expect(resolveOrgSlug(buildCurrentUser([lockedOrgA, defaultMemberships[1]]))).toBe('org-b')
    })

    it('THEN should skip an inaccessible persisted slug', () => {
      mockGetCurrentOrganizationId.mockReturnValue(undefined)
      mockGetPersistedOrganizationSlug.mockReturnValue('org-a')

      expect(resolveOrgSlug(buildCurrentUser([lockedOrgA, defaultMemberships[1]]))).toBe('org-b')
    })

    it('THEN should fall back to the first accessible membership, not memberships[0]', () => {
      mockGetCurrentOrganizationId.mockReturnValue(undefined)

      expect(resolveOrgSlug(buildCurrentUser([lockedOrgA, defaultMemberships[1]]))).toBe('org-b')
    })

    it('THEN should return undefined when no membership is accessible', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-a')
      mockGetPersistedOrganizationSlug.mockReturnValue('org-b')

      expect(resolveOrgSlug(buildCurrentUser([lockedOrgA, lockedOrgB]))).toBeUndefined()
    })
  })

  describe('GIVEN an undefined user', () => {
    it('THEN should return undefined', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-a')

      const result = resolveOrgSlug(undefined)

      expect(result).toBeUndefined()
    })
  })

  describe('GIVEN a user with no memberships', () => {
    it('THEN should return undefined', () => {
      mockGetCurrentOrganizationId.mockReturnValue(undefined)

      const result = resolveOrgSlug(buildCurrentUser([]))

      expect(result).toBeUndefined()
    })
  })
})

describe('pathHasValidSlug', () => {
  const currentUser = buildCurrentUser(defaultMemberships)

  describe('GIVEN a path that starts with a valid org slug', () => {
    it('THEN should return true', () => {
      expect(pathHasValidSlug('/org-a/customers', currentUser)).toBe(true)
    })
  })

  describe('GIVEN a path that starts with another valid org slug', () => {
    it('THEN should return true', () => {
      expect(pathHasValidSlug('/org-b/settings', currentUser)).toBe(true)
    })
  })

  describe('GIVEN a path that does not start with any valid slug', () => {
    it('THEN should return false', () => {
      expect(pathHasValidSlug('/unknown-org/customers', currentUser)).toBe(false)
    })
  })

  describe('GIVEN a path without a slug prefix', () => {
    it('THEN should return false', () => {
      expect(pathHasValidSlug('/customers', currentUser)).toBe(false)
    })
  })

  describe('GIVEN an undefined user', () => {
    it('THEN should return false', () => {
      expect(pathHasValidSlug('/org-a/customers', undefined)).toBe(false)
    })
  })

  describe('GIVEN a path that partially matches a slug but is not a prefix', () => {
    it('THEN should return false', () => {
      // "/org-a-extended/..." should not match "/org-a/"
      expect(pathHasValidSlug('/org-a-extended/customers', currentUser)).toBe(false)
    })
  })

  describe('GIVEN a path that is exactly the slug, or the slug followed by a query or hash', () => {
    it.each(['/org-a', '/org-a?tab=1', '/org-a#top'])('THEN should return true for %s', (path) => {
      expect(pathHasValidSlug(path, currentUser)).toBe(true)
    })
  })

  describe('GIVEN a slug-prefixed path without a leading slash', () => {
    it('THEN should return false so the caller makes it absolute', () => {
      expect(pathHasValidSlug('org-a/customers', currentUser)).toBe(false)
    })
  })

  describe('GIVEN a path that is the slug followed by a trailing slash only', () => {
    it('THEN should return true', () => {
      expect(pathHasValidSlug('/org-a/', currentUser)).toBe(true)
    })
  })
})

describe('ensureSlugPrefix', () => {
  const currentUser = buildCurrentUser(defaultMemberships)

  describe('GIVEN a path that already has a valid slug', () => {
    it('THEN should return the path unchanged', () => {
      expect(ensureSlugPrefix('/org-a/customers', 'org-a', currentUser)).toBe('/org-a/customers')
    })
  })

  describe('GIVEN a path without a slug that starts with /', () => {
    it('THEN should prepend the slug', () => {
      expect(ensureSlugPrefix('/customers', 'org-a', currentUser)).toBe('/org-a/customers')
    })
  })

  describe('GIVEN a path without a slug and without leading /', () => {
    it('THEN should prepend the slug with separators', () => {
      expect(ensureSlugPrefix('customers', 'org-a', currentUser)).toBe('/org-a/customers')
    })
  })

  describe('GIVEN a path whose slug is an organization the session cannot access', () => {
    it('THEN should return the path unchanged instead of double-prefixing it', () => {
      const lockedOrgB = {
        ...defaultMemberships[1],
        organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
      }

      expect(
        ensureSlugPrefix(
          '/org-b/settings',
          'org-a',
          buildCurrentUser([defaultMemberships[0], lockedOrgB]),
        ),
      ).toBe('/org-b/settings')
    })
  })

  describe('GIVEN the root of an org the user belongs to', () => {
    it.each(['/org-a', '/org-a?tab=1', '/org-a#top'])(
      'THEN should not prepend the slug a second time to %s',
      (path) => {
        expect(ensureSlugPrefix(path, 'org-a', currentUser)).toBe(path)
      },
    )
  })

  describe('GIVEN a legacy path that only starts with the characters of an org slug', () => {
    it('THEN should still prepend the slug', () => {
      expect(ensureSlugPrefix('/org-a-extended', 'org-a', currentUser)).toBe(
        '/org-a/org-a-extended',
      )
    })
  })

  describe('GIVEN a path with a different valid slug', () => {
    it('THEN should return the path unchanged', () => {
      expect(ensureSlugPrefix('/org-b/settings', 'org-a', currentUser)).toBe('/org-b/settings')
    })
  })

  describe('GIVEN a hostile off-origin path', () => {
    const ORIGIN = 'https://app.lago.dev'
    const HOSTILE_PATHS = [
      '//evil.com',
      '///evil.com',
      '/\\evil.com',
      '\\/evil.com',
      '\\\\evil.com',
      'https://evil.com',
      'javascript:alert(1)//',
    ]

    // `ensureSlugPrefix` rejects nothing; it prefixes unconditionally, adding
    // the `/` separator itself when the input lacks one. That leading
    // `/${slug}` is what keeps every shape same-origin, on v6 and on v7.
    it.each(HOSTILE_PATHS)('THEN the result stays same-origin for %s', (input) => {
      const result = ensureSlugPrefix(input, 'org-a', currentUser)

      expect(new URL(result, ORIGIN).origin).toBe(ORIGIN)
    })
  })
})

describe('getAccessibleMemberships', () => {
  describe('GIVEN a mix of accessible and inaccessible memberships', () => {
    it('THEN should keep only the accessible ones', () => {
      const lockedOrgB = {
        ...defaultMemberships[1],
        organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
      }

      expect(
        getAccessibleMemberships(buildCurrentUser([defaultMemberships[0], lockedOrgB])),
      ).toEqual([defaultMemberships[0]])
    })
  })

  describe('GIVEN an undefined user', () => {
    it('THEN should return an empty list', () => {
      expect(getAccessibleMemberships(undefined)).toEqual([])
    })
  })
})

describe('isAccessibleOrgSlug', () => {
  const lockedOrgB = {
    ...defaultMemberships[1],
    organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
  }
  const currentUser = buildCurrentUser([defaultMemberships[0], lockedOrgB])

  it('THEN should return true for an organization the session can open', () => {
    expect(isAccessibleOrgSlug('org-a', currentUser)).toBe(true)
  })

  it.each(['org-b', 'unknown', '', undefined])('THEN should return false for %s', (slug) => {
    expect(isAccessibleOrgSlug(slug, currentUser)).toBe(false)
  })
})

describe('findRefusedOrganization', () => {
  const lockedOrgB = {
    ...defaultMemberships[1],
    organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
  }
  const currentUser = buildCurrentUser([defaultMemberships[0], lockedOrgB])

  it('THEN should return the organization the session cannot open', () => {
    expect(findRefusedOrganization('org-b', currentUser)).toBe(lockedOrgB.organization)
  })

  it.each(['org-a', 'unknown', undefined])('THEN should return undefined for %s', (slug) => {
    expect(findRefusedOrganization(slug, currentUser)).toBeUndefined()
  })
})

describe('pathTargetsInaccessibleOrg', () => {
  const lockedOrgB = {
    ...defaultMemberships[1],
    organization: { ...defaultMemberships[1].organization, accessibleByCurrentSession: false },
  }
  const currentUser = buildCurrentUser([defaultMemberships[0], lockedOrgB])

  it.each(['/org-b/customers', '/org-b', '/org-b/', '/org-b?tab=1', '/org-b#top'])(
    'THEN should return true for %s',
    (path) => {
      expect(pathTargetsInaccessibleOrg(path, currentUser)).toBe(true)
    },
  )

  it.each([
    '/org-a/customers',
    '/customers',
    '/',
    '',
    '/org-b-extended/customers',
    'org-b/plans',
    '/unknown/plans',
  ])('THEN should return false for %s', (path) => {
    expect(pathTargetsInaccessibleOrg(path, currentUser)).toBe(false)
  })

  describe('GIVEN an undefined user', () => {
    it('THEN should return false', () => {
      expect(pathTargetsInaccessibleOrg('/org-b/customers', undefined)).toBe(false)
    })
  })
})
