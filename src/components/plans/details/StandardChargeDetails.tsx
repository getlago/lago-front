import { DetailsPage } from '~/components/layouts/DetailsPage'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatChargeDetailsAmount } from './formatChargeDetailsAmount'

type StandardChargeDetailsProps = {
  amount: string | null | undefined
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const StandardChargeDetails = ({
  amount,
  currency,
  pricingUnitShortName,
}: StandardChargeDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="standard"
      header={[translate('text_624453d52e945301380e49b6')]}
      body={[[formatChargeDetailsAmount(Number(amount) || 0, { currency, pricingUnitShortName })]]}
    />
  )
}
