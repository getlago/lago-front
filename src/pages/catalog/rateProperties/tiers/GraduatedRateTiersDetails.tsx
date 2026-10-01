import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { formatChargeDetailsAmount } from '~/components/plans/details/formatChargeDetailsAmount'
import { CurrencyEnum, PropertiesForRateCardRateFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getTierLabelKey, RATE_TIER_UP_TO_KEY } from './rateTiers'

type GraduatedRateTiersDetailsProps = {
  tiers: NonNullable<PropertiesForRateCardRateFragment['graduatedRanges']>
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const GraduatedRateTiersDetails = ({
  tiers,
  currency,
  pricingUnitShortName,
}: GraduatedRateTiersDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="graduated-rate-tiers"
      className="table-fixed [&_tbody_td:first-child]:bg-grey-100"
      header={[
        '',
        translate(RATE_TIER_UP_TO_KEY),
        translate('text_62793bbb599f1c01522e91b6'),
        translate('text_62793bbb599f1c01522e91bc'),
      ]}
      body={tiers.map((tier, index) => [
        <Typography key="label" variant="captionHl" color="grey600">
          {translate(getTierLabelKey(index))}
        </Typography>,
        tier.toValue ?? '∞',
        formatChargeDetailsAmount(Number(tier.perUnitAmount) || 0, {
          currency,
          pricingUnitShortName,
        }),
        formatChargeDetailsAmount(Number(tier.flatAmount) || 0, { currency, pricingUnitShortName }),
      ])}
    />
  )
}
