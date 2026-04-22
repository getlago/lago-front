import { useApolloClient, useReactiveVar } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { switchCurrentOrganization } from '~/core/apolloClient'
import {
  currentOrganizationVar,
  getCurrentOrganizationId,
  locationHistoryVar,
  setCurrentOrganizationId,
} from '~/core/apolloClient/reactiveVars'
import { useLocation, useNavigate } from '~/core/router'
import { LEGACY_APP_PATH_SEGMENTS } from '~/core/router/legacyPaths'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const Error404 = lazy(() => import('~/pages/Error404'))

const OrganizationLayout = () => {
  const { organizationSlug } = useParams<{ organizationSlug: string }>()
  const { currentUser, loading } = useCurrentUser()
  const { isAuthenticated } = useIsAuthenticated()
  const location = useLocation()
  const navigate = useNavigate()
  const client = useApolloClient()

  const currentOrgId = useReactiveVar(currentOrganizationVar)

  const org = currentUser?.memberships.find(
    (m) => m.organization.slug === organizationSlug,
  )?.organization

  // Single-membership auto-recovery: when a user with exactly one org lands
  // on a legacy pre-migration path (e.g. `/customers`), redirect them to
  // `/${theirOnlySlug}${legacyPath}` instead of showing a 404. No ambiguity
  // exists — we know which org they meant. Users with multiple memberships
  // keep the explicit 404 + "go home" flow because we can't pick for them.
  //
  // Scope-limited to `LEGACY_APP_PATH_SEGMENTS` on purpose: genuinely unknown
  // slugs (typos, revoked orgs, etc.) still produce a 404 — silently
  // redirecting an unknown slug would mask real errors.
  const isLegacyPath = LEGACY_APP_PATH_SEGMENTS.has(organizationSlug ?? '')
  const soleMembershipSlug =
    currentUser?.memberships.length === 1
      ? currentUser.memberships[0]?.organization.slug
      : undefined
  const shouldAutoRecoverLegacyPath = !loading && !org && isLegacyPath && !!soleMembershipSlug

  // If currentOrgId already exists and differs from org.id, the user switched org
  // (e.g. browser back after org switch). In that case, call switchCurrentOrganization
  // to clear the Apollo cache — otherwise stale data from the previous org leaks.
  useEffect(() => {
    if (org?.id) {
      if (currentOrgId && currentOrgId !== org.id) {
        switchCurrentOrganization(client, org.id)
      } else {
        setCurrentOrganizationId(org.id)
      }
    }
  }, [org?.id, currentOrgId, client])

  // Auto-recover legacy paths for single-membership users (see block above).
  // Runs in an effect (not render) to avoid React's "cannot update during
  // render" warning when navigation triggers a parent re-render. `replace`
  // keeps history clean — the legacy URL never gets a back-button entry.
  useEffect(() => {
    if (!shouldAutoRecoverLegacyPath) return

    navigate(`/${soleMembershipSlug}${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      skipSlugPrepend: true,
      state: { autoRecoveredFromLegacy: true },
    })

    Sentry.captureMessage('legacy_url_auto_recovered', {
      level: 'info',
      tags: {
        attemptedSlug: organizationSlug ?? '',
        recoveredToSlug: soleMembershipSlug ?? '',
      },
      extra: { fullPath: location.pathname },
    })
    // Note: we rebuild the target inline rather than reading from a memoized
    // value to keep the dependency surface minimal and the intent obvious.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoRecoverLegacyPath])

  // Track legacy path hits in Sentry once the user data has loaded and the
  // slug was confirmed invalid. Kept in an effect (rather than during render)
  // so it doesn't fire multiple times on StrictMode / re-renders and doesn't
  // couple render output to side-effects.
  //
  // Skipped when `shouldAutoRecoverLegacyPath` is true — that case emits its
  // own `legacy_url_auto_recovered` event and the user never sees a 404.
  useEffect(() => {
    if (loading || org || shouldAutoRecoverLegacyPath) return

    if (!isLegacyPath) return

    const previousLocations = locationHistoryVar()
    const previousPath = previousLocations[0]?.pathname
    const orgIdFromLS = getCurrentOrganizationId()
    const currentOrg = currentUser?.memberships?.find(
      (m) => m.organization.id === orgIdFromLS,
    )?.organization
    const isMissedMigration = currentOrg?.slug && previousPath?.startsWith(`/${currentOrg.slug}/`)

    const sharedContext = {
      tags: {
        attemptedSlug: organizationSlug ?? '',
        referrerType: document.referrer ? 'external' : 'direct',
      },
      extra: {
        fullPath: location.pathname,
        hasOrgInLS: !!orgIdFromLS,
        referrer: document.referrer || 'direct',
        currentOrgId: orgIdFromLS,
        previousPath: previousPath || null,
      },
    }

    if (isMissedMigration) {
      // Bug: a link/button inside the app wasn't migrated to use the slug wrapper.
      Sentry.captureMessage('slug_migration_missed_link', {
        level: 'error',
        ...sharedContext,
        tags: { ...sharedContext.tags, source: 'missed_migration' },
      })
    } else {
      // External hit: old bookmark, stale link, or typed URL.
      Sentry.captureMessage('legacy_url_accessed', {
        level: 'warning',
        ...sharedContext,
        tags: { ...sharedContext.tags, source: 'external' },
      })
    }
  }, [
    loading,
    org,
    organizationSlug,
    currentUser,
    location.pathname,
    isLegacyPath,
    shouldAutoRecoverLegacyPath,
  ])

  if (!isAuthenticated) return null

  if (loading && !org) return <Spinner />

  if (org) {
    if (currentOrgId !== org.id) return <Spinner />

    return <Outlet />
  }

  // Render a spinner while the auto-recover effect navigates — prevents a
  // one-frame `<Error404 />` flash before the URL updates.
  if (shouldAutoRecoverLegacyPath) return <Spinner />

  return (
    <Suspense fallback={<Spinner />}>
      <Error404 />
    </Suspense>
  )
}

export default OrganizationLayout
