import { Typography } from '~/components/designSystem/Typography'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Dashboard from '~/pages/dashboards/Dashboard'

const RevenueRecognitionDashboard = () => {
  const { translate } = useInternationalization()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccess = hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.RevenueRecognition)

  if (!hasAccess) {
    return (
      <FullscreenPage.Wrapper>
        <div className="flex max-w-170 flex-col gap-1">
          <Typography variant="headline" color="grey700" noWrap>
            {translate('text_1780667013874s6wl9cmxe7q')}
          </Typography>

          <Typography variant="body" color="grey600">
            {translate('text_1781081469637bvys7x3d4qp')}
          </Typography>
        </div>

        <PremiumFeature
          data-test="revenue-recognition-premium-feature"
          title={translate('text_1781081469637ymrcbjwcckn')}
          description={translate('text_1781081469637237iuf2vwnv')}
          feature={translate('text_1780667013874s6wl9cmxe7q')}
        />
      </FullscreenPage.Wrapper>
    )
  }

  return (
    <Dashboard
      contentTitle={translate('text_1780667013874s6wl9cmxe7q')}
      dashboardTitle="Revenue Recognition"
      dashboardTitleTestKey="superset-dashboard-test-name-revenue-recognition"
    />
  )
}

export default RevenueRecognitionDashboard
