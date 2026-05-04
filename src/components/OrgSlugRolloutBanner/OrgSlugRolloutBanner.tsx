import { useReactiveVar } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { getItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'
import { envGlobalVar, orgSlugOverridesVar } from '~/core/apolloClient/reactiveVars'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { ORG_SLUG_BANNER_DISMISSED_LS_KEY } from '~/core/constants/localStorageKeys'
import {
  customerObjectCreationRoutes,
  customerVoidRoutes,
  GENERAL_SETTINGS_ROUTE,
  objectCreationRoutes,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

// Centered/full-screen create-and-edit pages (no sidebar). The banner is hidden
// on these routes so it doesn't intrude on focused form flows.
const CENTERED_PAGE_PATHS: string[] = [
  ...objectCreationRoutes,
  ...customerObjectCreationRoutes,
  ...customerVoidRoutes,
].flatMap(({ path }) => {
  if (Array.isArray(path)) return path
  if (path) return [path]
  return []
})

// TODO(org-slug-rollout): two-phase removal — see ticket LAGO-1437.
// Cloud cleanup ≈1 week after May 11, 2026; self-hosted cleanup when the OSS release ships.

type DismissedOrgsMap = Record<string, true>

// Dismissals are keyed by organization **id** (stable) rather than slug
// (mutable via the edit dialog). Slug changes would otherwise resurface the
// banner on the same org after a rename.
const readDismissedOrgs = (): DismissedOrgsMap => {
  const raw = getItemFromLS(ORG_SLUG_BANNER_DISMISSED_LS_KEY)

  return raw && typeof raw === 'object' ? (raw as DismissedOrgsMap) : {}
}

export const ORG_SLUG_ROLLOUT_BANNER_TEST_ID = 'org-slug-rollout-banner'
export const ORG_SLUG_ROLLOUT_BANNER_DISMISS_TEST_ID = 'org-slug-rollout-banner-dismiss'
export const ORG_SLUG_ROLLOUT_BANNER_EDIT_TEST_ID = 'org-slug-rollout-banner-edit'
export const ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT = 'cloud'
export const ORG_SLUG_ROLLOUT_BANNER_SELFHOSTED_VARIANT = 'self-hosted'

export const OrgSlugRolloutBanner = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { apiUrl, appEnv } = envGlobalVar()
  // Source the slug from a per-org-id reactive var, with `useCurrentUser` as
  // the fallback. The var holds local in-memory overrides written by the edit
  // dialog — it survives org switches, so coming back to a previously-edited
  // org still reflects the local edit even when the cache round-trip returns
  // stale data. Reactive vars are always reactive (independent from Apollo
  // cache observers), avoiding all the post-`client.stop()` quirks.
  const { currentMembership, refetchCurrentUserInfos } = useCurrentUser()

  const orgId = currentMembership?.organization?.id
  const slugFromMembership = currentMembership?.organization?.slug
  const slugOverrides = useReactiveVar(orgSlugOverridesVar)

  const slug = (orgId && slugOverrides[orgId]) || slugFromMembership

  // Apollo cache is persisted (apollo3-cache-persist, see core/apolloClient/init.ts).
  // Users who loaded the app before the `slug` field was added to the
  // `CurrentUserInfos` fragment have a cached membership without it, so on
  // refresh the cache returns an org with `slug: undefined`. Detect that and
  // force a refetch to populate the field.
  useEffect(() => {
    if (currentMembership && !currentMembership.organization?.slug) {
      refetchCurrentUserInfos()
    }
  }, [currentMembership, refetchCurrentUserInfos])

  // Per-org dismiss: localStorage stores a `{ [orgId]: true }` map keyed by
  // organization id (stable across slug renames). Reading happens on each
  // render so switching orgs immediately reflects the right dismissed state.
  const [isDismissed, setIsDismissed] = useState<boolean>(() =>
    orgId ? !!readDismissedOrgs()[orgId] : false,
  )

  // Re-sync the dismiss flag whenever the active org changes (org switcher →
  // new org id → re-read LS).
  useEffect(() => {
    setIsDismissed(orgId ? !!readDismissedOrgs()[orgId] : false)
  }, [orgId])

  // Safety net: also doubles as our "user is authenticated + org data loaded"
  // check (no slug → unauthenticated → don't render the banner).
  if (!slug) return null
  if (isDismissed) return null

  // Hide on full-screen create / edit pages (no sidebar) to avoid intruding
  // on focused form flows.
  const isCenteredPage = CENTERED_PAGE_PATHS.some((p) => matchPath(p, pathname))

  if (isCenteredPage) return null

  const isLagoCloud = /\.getlago\.com/.test(apiUrl)
  const isDev = appEnv === AppEnvEnum.development
  const variant =
    isLagoCloud || isDev
      ? ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT
      : ORG_SLUG_ROLLOUT_BANNER_SELFHOSTED_VARIANT

  const titleKey =
    variant === ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT
      ? 'text_17774609583343asd6ddpg4o'
      : 'text_1777460958334tydafvw4tjn'

  const descriptionKey =
    variant === ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT
      ? 'text_1777460958334ulbsddgq9pn'
      : 'text_177746095833445oggkposdq'

  const handleDismiss = () => {
    if (orgId) {
      const dismissedOrgs = readDismissedOrgs()

      setItemFromLS(ORG_SLUG_BANNER_DISMISSED_LS_KEY, { ...dismissedOrgs, [orgId]: true })
    }
    setIsDismissed(true)
  }

  return (
    // `key={slug}` forces a remount on org switch so the slug interpolation
    // in the description copy is always fresh — protects against any stale
    // render coming from React/Apollo's reconciliation timing.
    <div
      key={slug}
      className="sticky top-0 z-navBar w-full bg-purple-100"
      data-test={ORG_SLUG_ROLLOUT_BANNER_TEST_ID}
      data-variant={variant}
    >
      <div className="flex w-full items-center gap-4 px-12 py-4">
        <Icon name="info-circle" color="info" />

        <div className="flex flex-1 flex-col gap-1">
          <span className="text-base font-medium text-grey-700">{translate(titleKey)}</span>
          <span
            className="text-sm text-grey-600 [&_*]:text-sm"
            dangerouslySetInnerHTML={{ __html: translate(descriptionKey, { slug }) }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="quaternary-dark"
            size="medium"
            data-test={ORG_SLUG_ROLLOUT_BANNER_EDIT_TEST_ID}
            onClick={() => navigate(GENERAL_SETTINGS_ROUTE)}
          >
            {translate('text_1777460958334ehtlaesho6e')}
          </Button>
          <Button
            icon="close"
            variant="quaternary-dark"
            size="medium"
            data-test={ORG_SLUG_ROLLOUT_BANNER_DISMISS_TEST_ID}
            onClick={handleDismiss}
          />
        </div>
      </div>
    </div>
  )
}
