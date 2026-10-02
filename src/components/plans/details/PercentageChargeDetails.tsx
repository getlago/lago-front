import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatChargeDetailsAmount } from './formatChargeDetailsAmount'

type PercentageChargeDetailsProps = {
  rate: string | null | undefined
  fixedAmount: string | null | undefined
  freeUnitsPerEvents: string | number | null | undefined
  freeUnitsPerTotalAggregation: string | null | undefined
  perTransactionMinAmount: string | null | undefined
  perTransactionMaxAmount: string | null | undefined
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const PercentageChargeDetails = ({
  rate,
  fixedAmount,
  freeUnitsPerEvents,
  freeUnitsPerTotalAggregation,
  perTransactionMinAmount,
  perTransactionMaxAmount,
  currency,
  pricingUnitShortName,
}: PercentageChargeDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  const formatAmount = (amount: number): string =>
    formatChargeDetailsAmount(amount, { currency, pricingUnitShortName })

  return (
    <>
      <DetailsPage.TableDisplay
        name="percentage"
        header={[
          translate('text_64de472463e2da6b31737de0'),
          translate('text_62ff5d01a306e274d4ffcc1e'),
          translate('text_65201b8216455901fe273dfb'),
          translate('text_62ff5d01a306e274d4ffcc48'),
        ]}
        body={[
          [
            intlFormatNumber(Number(rate) / 100 || 0, {
              style: 'percent',
              maximumFractionDigits: 15,
            }),
            formatAmount(Number(fixedAmount) || 0),
            freeUnitsPerEvents || 0,
            formatAmount(Number(freeUnitsPerTotalAggregation) || 0),
          ],
        ]}
      />

      <DetailsPage.InfoGrid
        grid={[
          {
            label: translate('text_65201b8216455901fe273e01'),
            value: formatAmount(Number(perTransactionMinAmount || 0)),
          },
          {
            label: translate('text_65201b8216455901fe273e03'),
            value: formatAmount(Number(perTransactionMaxAmount || 0)),
          },
        ]}
      />
    </>
  )
}
