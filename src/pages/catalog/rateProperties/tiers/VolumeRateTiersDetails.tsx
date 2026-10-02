import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { formatChargeDetailsAmount } from '~/components/plans/details/formatChargeDetailsAmount'
import { CurrencyEnum, PropertiesForRateCardRateFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { RATE_TIER_TOTAL_UNITS_LABEL_KEY, RATE_TIER_UP_TO_KEY } from './rateTiers'

type VolumeRateTiersDetailsProps = {
  tiers: NonNullable<PropertiesForRateCardRateFragment['volumeRanges']>
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const VolumeRateTiersDetails = ({
  tiers,
  currency,
  pricingUnitShortName,
}: VolumeRateTiersDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="volume-rate-tiers"
      className="table-fixed [&_tbody_td:first-child]:bg-grey-100 [&_tbody_tr:not(:last-child)_td:first-child]:shadow-b"
      header={[
        '',
        translate(RATE_TIER_UP_TO_KEY),
        translate('text_62793bbb599f1c01522e91b6'),
        translate('text_62793bbb599f1c01522e91bc'),
      ]}
      body={tiers.map((tier) => [
        <Typography key="label" variant="captionHl" color="grey600">
          {translate(RATE_TIER_TOTAL_UNITS_LABEL_KEY)}
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
