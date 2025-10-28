import { AiBadge, Icon, Tooltip, Typography } from 'lago-design-system'
import { useRef } from 'react'

import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { ForecastsOverviewSection } from '~/pages/forecasts/ForecastsOverviewSection'
import { PageHeader } from '~/styles'

export const BadgeAI = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center gap-1">
      <AiBadge iconSize={12}>
        <Typography className="mt-px text-xs font-medium text-purple-700">
          {translate('text_17530144570404vslv3s1ki3')}
        </Typography>
      </AiBadge>
    </div>
  )
}

const Forecasts = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToForecastsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.ForecastedUsage,
  )

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1753014457040hxp6wkphkvw')}
        </Typography>
      </PageHeader.Wrapper>

      <FullscreenPage.Wrapper>
        <div className="flex items-center gap-2">
          <Typography variant="headline" color="grey700">
            {translate('text_1753014457040hxp6wkphkvw')}
          </Typography>

          <Tooltip
            placement="top-start"
            title={translate('text_17530144570400ri03obw5mv')}
            className="flex"
          >
            <Icon name="info-circle" className="text-grey-600" />
          </Tooltip>

          <BadgeAI />
        </div>

        {!hasAccessToForecastsFeature && (
          <div className="max-w-2xl">
            <div>
              <PremiumFeature
                title={translate('text_1761560753771d6ppz3evqxc')}
                description={translate('text_1761560714509hv9325ywuzq')}
                feature={translate('text_1753014457040hxp6wkphkvw')}
              />
            </div>
          </div>
        )}

        {hasAccessToForecastsFeature && (
          <ForecastsOverviewSection premiumWarningDialogRef={premiumWarningDialogRef} />
        )}
      </FullscreenPage.Wrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default Forecasts
