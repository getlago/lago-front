import { Typography } from '~/components/designSystem/Typography'
import { FreemiumBlock } from '~/components/premium/FreemiumBlock'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

export const ProgressiveBillingSection = () => {
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
  const { translate } = useInternationalization()

  const hasPremiumIntegration = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.ProgressiveBilling,
  )

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1724179887722baucvj7bvc1')}
        </Typography>
        <Typography
          variant="caption"
          color="grey600"
          html={translate('text_17697190237696lh0e8n9vog')}
        />
      </div>

      {!hasPremiumIntegration && (
        <FreemiumBlock
          translationKeys={{
            title: 'text_1724345142892pcnx5m2k3r2',
            description: 'text_1724345142892ljzi79afhmc',
            emailSubject: 'text_172434514289283gmf8bdhh3',
            emailBody: 'text_1724346450317iqs2rtvx1tp',
          }}
        />
      )}
    </div>
  )
}
