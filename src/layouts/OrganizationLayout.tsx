import { useApolloClient, useReactiveVar } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { Outlet, useParams } from 'react-router'

import { Spinner } from '~/components/designSystem/Spinner'
import { switchCurrentOrganization } from '~/core/apolloClient'
import {
  currentOrganizationVar,
  getPersistedOrganizationSlug,
  locationHistoryVar,
  setCurrentOrganizationId,
  setPersistedOrganizationSlug,
} from '~/core/apolloClient/reactiveVars'
import { useLocation, useNavigate } from '~/core/router'
import { LEGACY_APP_PATH_SEGMENTS } from '~/core/router/legacyPaths'
import { getAccessibleMemberships, resolveOrgSlug } from '~/core/router/utils/orgSlug'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const Error404 = lazy(() => import('~/pages/Error404'))
const Forbidden = lazy(() => import('~/pages/Forbidden'))

/**
 * Sentry events from this layout use a named `Error` subclass + `captureException`
 * (instead of `captureMessage`) so Sentry's issue title generator picks up the
 * meaningful `{name}: {message}` pair instead of the topmost stack frame from
 * the synthetic stacktrace it attaches to messages (which renders as
 * `commitHookEffectListMount` because we capture from inside a `useEffect`).
 */
class OrganizationLayoutEvent extends Error {
  constructor(name: string, message: string) {
    super(message)
    this.name = name
  }
}

const OrganizationLayout = () => {
  const { organizationSlug } = useParams<{ organizationSlug: string }>()
  const { currentUser, loading } = useCurrentUser()
  const { isAuthenticated } = useIsAuthenticated()
  const location = useLocation()
  const navigate = useNavigate()
  const client = useApolloClient()

  const currentOrgId = useReactiveVar(currentOrganizationVar)

  const membershipOrg = currentUser?.memberships.find(
    (m) => m.organization.slug === organizationSlug,
  )?.organization
  // The API refuses every request to an organization the session can't open.
  const org = membershipOrg?.accessibleByCurrentSession ? membershipOrg : undefined

  // Auto-recovery for legacy pre-migration paths (e.g. `/customers`).
  const isLegacyPath = LEGACY_APP_PATH_SEGMENTS.has(organizationSlug ?? '')

  const recoveredSlug = resolveOrgSlug(currentUser)

  const shouldAutoRecoverLegacyPath = !loading && !membershipOrg && isLegacyPath && !!recoveredSlug
  const hasNoAccessibleOrgForLegacyPath =
    !loading &&
    !membershipOrg &&
    isLegacyPath &&
    !recoveredSlug &&
    !!currentUser?.memberships.length
  const isInaccessibleOrg = !loading && !!membershipOrg && !org
  const isRefusedBySession = isInaccessibleOrg || hasNoAccessibleOrgForLegacyPath
  const reportedVisitKeyRef = useRef<string | null>(null)

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
      // Remember the last used org slug — the only org-related LS write. Read
      // by `RootRedirect` at `/` to pick a landing slug when the URL has none.
      setPersistedOrganizationSlug(org.slug)
    }
  }, [org?.id, org?.slug, currentOrgId, client])

  // Auto-recover legacy paths universally. Runs in an effect (not render) to
  // avoid React's "cannot update during render" warning when navigation
  // triggers a parent re-render. `replace` keeps history clean — the legacy
  // URL never gets a back-button entry.
  //
  // Emits `slug_migration_missed_link` (error) when the previous in-app path
  // was slug-prefixed. This is the developer-actionable signal that an in-app
  // link wasn't migrated to the slug wrapper. Auto-recovery silences the
  // user-facing 404, but we keep this signal so the bug remains visible in
  // Sentry and dev alerts can fire on it.
  useEffect(() => {
    if (!shouldAutoRecoverLegacyPath) return

    navigate(`/${recoveredSlug}${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      skipSlugPrepend: true,
    })

    // Detect missed-migration in-app links. `previousPath` is read from
    // `locationHistoryVar` which records pathnames the user navigated through;
    // if the previous one starts with the current org's slug, the user was
    // already inside the app and a non-migrated link sent them to a
    // slug-less path. That's a real bug — emit `error` so it's actionable.
    const previousLocations = locationHistoryVar()
    const previousPath = previousLocations[0]?.pathname
    // Use the persisted last-used slug to guess the org the user was on (the
    // var is null on a legacy slug-less path); analytics-only signal.
    const persistedSlug = getPersistedOrganizationSlug()
    const currentOrg = currentUser?.memberships?.find(
      (m) => m.organization.slug === persistedSlug,
    )?.organization
    const isMissedMigration = currentOrg?.slug && previousPath?.startsWith(`/${currentOrg.slug}/`)

    if (isMissedMigration) {
      Sentry.captureException(
        new OrganizationLayoutEvent('SlugMigrationMissedLink', 'slug_migration_missed_link'),
        {
          level: 'error',
          tags: {
            feature: 'slug-migration',
            attemptedSlug: organizationSlug ?? '',
            source: 'missed_migration',
          },
          extra: {
            fullPath: location.pathname,
            previousPath: previousPath || null,
            currentOrgId: currentOrg?.id,
          },
        },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoRecoverLegacyPath])

  // `external` (bookmark, shared link) is expected. `in_app` means one of our own
  // links or redirects sent the user to an organization the session cannot open.
  useEffect(() => {
    if (!isRefusedBySession) return
    // A `currentUser` refetch toggles `loading`, which would report the same visit again.
    if (reportedVisitKeyRef.current === location.key) return

    reportedVisitKeyRef.current = location.key

    const previousPath = locationHistoryVar()[0]?.pathname
    // React Router's per-document history index: 0 is the entry the browser loaded the app on.
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0
    const event = isInaccessibleOrg
      ? new OrganizationLayoutEvent('OrganizationInaccessible', 'org_inaccessible_for_session')
      : new OrganizationLayoutEvent('NoOrganizationAccessible', 'no_org_accessible_for_session')

    Sentry.captureException(event, {
      level: 'warning',
      tags: {
        feature: 'org-access',
        attemptedSlug: organizationSlug ?? '',
        source: historyIndex > 0 ? 'in_app' : 'external',
      },
      extra: {
        fullPath: location.pathname,
        previousPath: previousPath || null,
        accessibleMembershipsCount: getAccessibleMemberships(currentUser).length,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefusedBySession, location.key])

  if (!isAuthenticated) return null

  if (loading && !org) return <Spinner />

  if ((membershipOrg && !org) || hasNoAccessibleOrgForLegacyPath) {
    return (
      <Suspense fallback={<Spinner />}>
        <Forbidden />
      </Suspense>
    )
  }

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
