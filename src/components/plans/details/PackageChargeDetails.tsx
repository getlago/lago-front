import { DetailsPage } from '~/components/layouts/DetailsPage'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { formatChargeDetailsAmount } from './formatChargeDetailsAmount'

type PackageChargeDetailsProps = {
  amount: string | null | undefined
  packageSize: string | number | null | undefined
  freeUnits: string | number | null | undefined
  currency: CurrencyEnum
  pricingUnitShortName: string | undefined
}

export const PackageChargeDetails = ({
  amount,
  packageSize,
  freeUnits,
  currency,
  pricingUnitShortName,
}: PackageChargeDetailsProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <DetailsPage.TableDisplay
      name="package"
      header={[
        translate('text_624453d52e945301380e49b6'),
        translate('text_65201b8216455901fe273de7'),
        translate('text_65201b8216455901fe273de8'),
      ]}
      body={[
        [
          formatChargeDetailsAmount(Number(amount) || 0, { currency, pricingUnitShortName }),
          packageSize,
          freeUnits,
        ],
      ]}
    />
  )
}
