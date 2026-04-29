import { useNavigate } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { envGlobalVar } from '~/core/apolloClient/reactiveVars'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { GENERAL_SETTINGS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// TODO(org-slug-rollout): two-phase removal — see ticket §7.
// Cloud cleanup ≈1 week after May 8, 2026; self-hosted cleanup when the OSS release ships.

export const ORG_SLUG_ROLLOUT_BANNER_TEST_ID = 'org-slug-rollout-banner'
export const ORG_SLUG_ROLLOUT_BANNER_CLOUD_VARIANT = 'cloud'
export const ORG_SLUG_ROLLOUT_BANNER_SELFHOSTED_VARIANT = 'self-hosted'

export const OrgSlugRolloutBanner = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { apiUrl, appEnv } = envGlobalVar()
  const { organization } = useOrganizationInfos()

  const slug = organization?.slug

  // Safety net: BE backfill guarantees presence, but never render `/undefined/customers`.
  if (!slug) return null

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

  return (
    <Alert
      type="info"
      fullWidth
      data-test={ORG_SLUG_ROLLOUT_BANNER_TEST_ID}
      data-variant={variant}
      ButtonProps={{
        label: translate('text_1777460958334ehtlaesho6e'),
        onClick: () => navigate(GENERAL_SETTINGS_ROUTE),
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium">{translate(titleKey)}</span>
        <span
          className="text-sm [&_*]:text-sm"
          dangerouslySetInnerHTML={{ __html: translate(descriptionKey, { slug }) }}
        />
      </div>
    </Alert>
  )
}
