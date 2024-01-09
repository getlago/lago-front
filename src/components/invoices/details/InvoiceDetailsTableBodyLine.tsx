import { gql } from '@apollo/client'
import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  ChargeModelEnum,
  CurrencyEnum,
  FeeForInvoiceDetailsTableBodyLineGraduatedFragmentDoc,
  FeeForInvoiceDetailsTableBodyLineGraduatedPercentageFragmentDoc,
  FeeForInvoiceDetailsTableBodyLinePackageFragmentDoc,
  FeeForInvoiceDetailsTableBodyLinePercentageFragmentDoc,
  FeeForInvoiceDetailsTableBodyLineVolumeFragmentDoc,
  FeeTypesEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceDetailsTableBodyLineGraduated } from './InvoiceDetailsTableBodyLineGraduated'
import { InvoiceDetailsTableBodyLineGraduatedPercentage } from './InvoiceDetailsTableBodyLineGraduatedPercentage'
import { InvoiceDetailsTableBodyLinePackage } from './InvoiceDetailsTableBodyLinePackage'
import { InvoiceDetailsTableBodyLinePercentage } from './InvoiceDetailsTableBodyLinePercentage'
import { InvoiceDetailsTableBodyLineVolume } from './InvoiceDetailsTableBodyLineVolume'

gql`
  fragment FeeForInvoiceDetailsTableBodyLine on Fee {
    id
    units
    preciseUnitAmount
    amountCents
    eventsCount
    charge {
      id
      chargeModel
      minAmountCents
      payInAdvance
      prorated
    }
    appliedTaxes {
      id
      taxRate
    }

    ...FeeForInvoiceDetailsTableBodyLineGraduated
    ...FeeForInvoiceDetailsTableBodyLineGraduatedPercentage
    ...FeeForInvoiceDetailsTableBodyLineVolume
    ...FeeForInvoiceDetailsTableBodyLinePackage
    ...FeeForInvoiceDetailsTableBodyLinePercentage
  }

  ${FeeForInvoiceDetailsTableBodyLineGraduatedFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLineGraduatedPercentageFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLineVolumeFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLinePackageFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLinePercentageFragmentDoc}
`

type InvoiceDetailsTableBodyLineProps = {
  canHaveUnitPrice: boolean
  currency: CurrencyEnum
  displayName: string
  fee: TExtendedRemainingFee | undefined
}

export const InvoiceDetailsTableBodyLine = memo(
  ({ canHaveUnitPrice, currency, displayName, fee }: InvoiceDetailsTableBodyLineProps) => {
    const { translate } = useInternationalization()
    const chargeModel = fee?.charge?.chargeModel
    const isTrueUpFee = fee?.metadata?.isTrueUpFee && !!fee?.charge?.minAmountCents
    const subLabel = !canHaveUnitPrice
      ? undefined
      : fee?.description
        ? fee?.description
        : chargeModel === ChargeModelEnum.Percentage
          ? translate('text_659e67cd63512ef53284303e', { eventsCount: fee?.eventsCount })
          : fee?.charge?.prorated
            ? translate('text_659e6b6b8e57e6ff88a34930')
            : isTrueUpFee
              ? translate('text_659e67cd63512ef53284305a', {
                  amount: intlFormatNumber(
                    deserializeAmount(fee?.charge?.minAmountCents, currency),
                    {
                      currencyDisplay: 'symbol',
                      currency,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 15,
                    },
                  ),
                })
              : undefined
    const isValidGraduatedToHaveDetails =
      fee?.charge?.chargeModel === ChargeModelEnum.Graduated && !fee.charge.prorated
    const isValidChargeModelToHaveDetails =
      isValidGraduatedToHaveDetails ||
      fee?.charge?.chargeModel === ChargeModelEnum.Volume ||
      fee?.charge?.chargeModel === ChargeModelEnum.Package ||
      fee?.charge?.chargeModel === ChargeModelEnum.Percentage ||
      fee?.charge?.chargeModel === ChargeModelEnum.GraduatedPercentage
    const shouldDisplayFeeDetail =
      !!fee &&
      !isTrueUpFee &&
      !fee?.metadata?.isSubscriptionFee &&
      !fee.charge?.payInAdvance &&
      chargeModel !== ChargeModelEnum.Standard &&
      fee.feeType !== FeeTypesEnum.AddOn &&
      fee.feeType !== FeeTypesEnum.Credit &&
      isValidChargeModelToHaveDetails &&
      canHaveUnitPrice

    return (
      <>
        <tr className={shouldDisplayFeeDetail ? 'has-details' : ''}>
          <td colSpan={shouldDisplayFeeDetail ? 5 : 1}>
            <Typography variant="bodyHl" color="grey700">
              {displayName}
              {isTrueUpFee ? ` - ${translate('text_64463aaa34904c00a23be4f7')}` : ''}
            </Typography>
            {!!subLabel && (
              <Typography variant="caption" color="grey600">
                {subLabel}
              </Typography>
            )}
          </td>
          {/* Basic line infos */}
          {!shouldDisplayFeeDetail && (
            <>
              <td>
                <Typography variant="body" color="grey700">
                  {fee?.units || 1}
                </Typography>
              </td>
              {canHaveUnitPrice && (
                <td>
                  <Typography variant="body" color="grey700">
                    {intlFormatNumber(fee?.preciseUnitAmount || 0, {
                      currencyDisplay: 'symbol',
                      currency,
                      maximumFractionDigits: 15,
                    })}
                  </Typography>
                </td>
              )}
              <td>
                <Typography variant="body" color="grey700">
                  {fee?.appliedTaxes?.length
                    ? fee?.appliedTaxes.map((appliedTaxes) => (
                        <Typography
                          key={`fee-${fee?.id}-applied-taxe-${appliedTaxes.id}`}
                          variant="body"
                          color="grey700"
                        >
                          {intlFormatNumber(appliedTaxes.taxRate / 100 || 0, {
                            maximumFractionDigits: 2,
                            style: 'percent',
                          })}
                        </Typography>
                      ))
                    : '0%'}
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="grey700">
                  {intlFormatNumber(deserializeAmount(fee?.amountCents || 0, currency), {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                </Typography>
              </td>
            </>
          )}
        </tr>
        {shouldDisplayFeeDetail && (
          <>
            {chargeModel === ChargeModelEnum.Graduated ? (
              <InvoiceDetailsTableBodyLineGraduated currency={currency} fee={fee} />
            ) : chargeModel === ChargeModelEnum.GraduatedPercentage ? (
              <InvoiceDetailsTableBodyLineGraduatedPercentage currency={currency} fee={fee} />
            ) : chargeModel === ChargeModelEnum.Volume ? (
              <InvoiceDetailsTableBodyLineVolume currency={currency} fee={fee} />
            ) : chargeModel === ChargeModelEnum.Package ? (
              <InvoiceDetailsTableBodyLinePackage currency={currency} fee={fee} />
            ) : chargeModel === ChargeModelEnum.Percentage ? (
              <InvoiceDetailsTableBodyLinePercentage currency={currency} fee={fee} />
            ) : null}
            <tr className="details-line subtotal">
              <td colSpan={4}>
                <Typography variant="body" color="grey700">
                  {translate('text_659e67cd63512ef532843154')}
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="grey700">
                  {intlFormatNumber(deserializeAmount(fee?.amountCents || 0, currency), {
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                </Typography>
              </td>
            </tr>
          </>
        )}
      </>
    )
  },
)

InvoiceDetailsTableBodyLine.displayName = 'InvoiceDetailsTableBodyLine'
