import { Icon } from 'lago-design-system'
import { useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { getItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'
import { envGlobalVar } from '~/core/apolloClient/reactiveVars'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { ORG_SLUG_BANNER_DISMISSED_LS_KEY } from '~/core/constants/localStorageKeys'
import {
  customerObjectCreationRoutes,
  customerVoidRoutes,
  GENERAL_SETTINGS_ROUTE,
  objectCreationRoutes,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

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
  const { organization } = useOrganizationInfos()

  const [isDismissed, setIsDismissed] = useState(
    () => getItemFromLS(ORG_SLUG_BANNER_DISMISSED_LS_KEY) === true,
  )

  const slug = organization?.slug

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
    setItemFromLS(ORG_SLUG_BANNER_DISMISSED_LS_KEY, true)
    setIsDismissed(true)
  }

  return (
    <div
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
