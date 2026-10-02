import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { formatChargeDetailsAmount } from '~/components/plans/details/formatChargeDetailsAmount'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, PropertiesForRateCardRateFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getTierLabelKey, RATE_TIER_UP_TO_KEY, toPercentRatio } from './rateTiers'

type GraduatedPercentageRateTiersDetailsProps = {
  tiers: NonNullable<PropertiesForRateCardRateFragment['graduatedPercentageRanges']>
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const GraduatedPercentageRateTiersDetails = ({
  tiers,
  currency,
  pricingUnitShortName,
}: GraduatedPercentageRateTiersDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="graduated-percentage-rate-tiers"
      className="table-fixed [&_tbody_td:first-child]:bg-grey-100 [&_tbody_tr:not(:last-child)_td:first-child]:shadow-b"
      header={[
        '',
        translate(RATE_TIER_UP_TO_KEY),
        translate('text_64de472463e2da6b31737de0'),
        translate('text_62793bbb599f1c01522e91bc'),
      ]}
      body={tiers.map((tier, index) => [
        <Typography key="label" variant="captionHl" color="grey600">
          {translate(getTierLabelKey(index))}
        </Typography>,
        tier.toValue ?? '∞',
        intlFormatNumber(toPercentRatio(tier.rate), {
          style: 'percent',
          maximumFractionDigits: 15,
        }),
        formatChargeDetailsAmount(Number(tier.flatAmount) || 0, { currency, pricingUnitShortName }),
      ])}
    />
  )
}
