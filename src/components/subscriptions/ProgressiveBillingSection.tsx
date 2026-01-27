import { Icon } from 'lago-design-system'

import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { Typography } from '~/components/designSystem/Typography'
import { PROGRESSIVE_BILLING_DOC_URL } from '~/core/constants/externalUrls'
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
    <>
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="bodyHl" color="grey700">
            {translate('text_1724179887722baucvj7bvc1')}
          </Typography>
          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_1724179887723kdf3nisf6hp', { href: PROGRESSIVE_BILLING_DOC_URL })}
          />
        </div>

        {!hasPremiumIntegration && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-grey-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Typography variant="bodyHl" color="textSecondary">
                {translate('text_1724345142892pcnx5m2k3r2')}
              </Typography>
              <Icon name="sparkles" />
            </div>
            <Typography variant="caption">{translate('text_1724345142892ljzi79afhmc')}</Typography>
            <ButtonLink
              buttonProps={{
                variant: 'tertiary',
                size: 'medium',
                endIcon: 'sparkles',
              }}
              type="button"
              external
              to={`mailto:hello@getlago.com?subject=${translate('text_172434514289283gmf8bdhh3')}&body=${translate('text_1724346450317iqs2rtvx1tp')}`}
            >
              {translate('text_65ae73ebe3a66bec2b91d72d')}
            </ButtonLink>
          </div>
        )}
      </div>
    </>
  )
}
