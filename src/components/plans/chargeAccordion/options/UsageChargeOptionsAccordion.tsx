import { gql } from '@apollo/client'

import { Chip, Typography } from '~/components/designSystem'
import {
  OptionsAccordion,
  OptionsAccordionProps,
} from '~/components/plans/chargeAccordion/options/OptionsAccordion'
import { LocalUsageChargeInput } from '~/components/plans/types'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RegroupPaidFeesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ChargeForUsageChargeOptionsAccordion on Charge {
    id
    invoiceable
    minAmountCents
    payInAdvance
    regroupPaidFees
  }
`

interface UsageChargeOptionsAccordionProps {
  charge: LocalUsageChargeInput
  chargePricingUnitShortName: string | undefined
  children: OptionsAccordionProps['children']
  currency: CurrencyEnum
}

export const UsageChargeOptionsAccordion = ({
  charge,
  chargePricingUnitShortName,
  children,
  currency,
}: UsageChargeOptionsAccordionProps) => {
  const { translate } = useInternationalization()

  const getInvoiceableChargeLabel = (localCharge: LocalUsageChargeInput) => {
    if (localCharge.payInAdvance) {
      if (localCharge.regroupPaidFees === RegroupPaidFeesEnum.Invoice) {
        return translate('text_6682c52081acea9052074502')
      }

      if (localCharge.invoiceable) {
        return translate('text_6682c52081acea90520744bc')
      }

      return translate('text_6682c52081acea9052074686')
    }

    return translate('text_6682c52081acea9052074502')
  }

  return (
    <OptionsAccordion
      summary={
        <div className="mr-3 flex flex-1 flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_646e2d0cc536351b62ba6f01')}
          </Typography>
          <div className="flex flex-wrap gap-2">
            <Chip
              label={
                charge.payInAdvance
                  ? translate('text_646e2d0bc536351b62ba6ebb')
                  : translate('text_646e2d0cc536351b62ba6f0c')
              }
            />
            <Chip label={getInvoiceableChargeLabel(charge)} />
            <Chip
              label={
                charge.prorated
                  ? translate('text_649c47c0a6c1f200de8ff48d')
                  : translate('text_649c49bcebd91c0082d84446')
              }
            />

            <Chip
              label={
                !!Number(charge.minAmountCents)
                  ? translate('text_646e2d0cc536351b62ba6fcf', {
                      minAmountCents: intlFormatNumber(charge.minAmountCents, {
                        pricingUnitShortName: chargePricingUnitShortName,
                        currencyDisplay: 'symbol',
                        currency,
                        maximumFractionDigits: 15,
                      }),
                    })
                  : translate('text_646e2d0cc536351b62ba6f20')
              }
            />
          </div>
        </div>
      }
    >
      {children}
    </OptionsAccordion>
  )
}
