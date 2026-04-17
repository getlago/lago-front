import { useApolloClient, useReactiveVar } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { switchCurrentOrganization } from '~/core/apolloClient'
import {
  currentOrganizationVar,
  getCurrentOrganizationId,
  locationHistoryVar,
  setCurrentOrganizationId,
} from '~/core/apolloClient/reactiveVars'
import { LEGACY_APP_PATH_SEGMENTS } from '~/core/router/legacyPaths'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const Error404 = lazy(() => import('~/pages/Error404'))

const OrganizationLayout = () => {
  const { organizationSlug } = useParams<{ organizationSlug: string }>()
  const { currentUser, loading } = useCurrentUser()
  const location = useLocation()
  const client = useApolloClient()

  const currentOrgId = useReactiveVar(currentOrganizationVar)

  const org = currentUser?.memberships.find(
    (m) => m.organization.slug === organizationSlug,
  )?.organization

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

  if (loading && !org) return <Spinner />

  if (org) {
    if (currentOrgId !== org.id) return <Spinner />

    return <Outlet />
  }

  // Org not found — distinguish legacy path from unknown slug
  const isLegacyPath = LEGACY_APP_PATH_SEGMENTS.has(organizationSlug ?? '')

  if (isLegacyPath) {
    // Detect if this is a missed internal migration or an external legacy hit
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
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Error404 />
    </Suspense>
  )
}

export default OrganizationLayout
