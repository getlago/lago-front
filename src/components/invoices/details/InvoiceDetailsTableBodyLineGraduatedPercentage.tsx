import { gql } from '@apollo/client'
import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FeeForInvoiceDetailsTableBodyLineGraduatedPercentage on Fee {
    id
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      graduatedPercentageRanges {
        flatUnitAmount
        fromValue
        perUnitTotalAmount
        rate
        toValue
        totalWithFlatAmount
        units
      }
    }
  }
`

type InvoiceDetailsTableBodyLineGraduatedPercentageProps = {
  currency: CurrencyEnum
  fee: TExtendedRemainingFee | undefined
}

export const InvoiceDetailsTableBodyLineGraduatedPercentage = memo(
  ({ currency, fee }: InvoiceDetailsTableBodyLineGraduatedPercentageProps) => {
    const { translate } = useInternationalization()

    return (
      <>
        {fee?.amountDetails?.graduatedPercentageRanges?.map((graduatedPercentageRange, i) => (
          <tr
            key={`fee-${fee.id}-graduated-percentage-range-fee-per-unit-${i}`}
            className="details-line"
          >
            <td>
              <Typography variant="body" color="grey600">
                {i === 0
                  ? translate('text_659e67cd63512ef532843070', {
                      toValue: Number(graduatedPercentageRange?.toValue),
                    })
                  : i === (fee?.amountDetails?.graduatedPercentageRanges?.length || 0) - 1
                    ? translate('text_659e67cd63512ef5328430e6', {
                        fromValue: Number(graduatedPercentageRange?.fromValue),
                      })
                    : translate('text_659e67cd63512ef5328430af', {
                        fromValue: Number(graduatedPercentageRange?.fromValue),
                        toValue: Number(graduatedPercentageRange?.toValue),
                      })}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {Number(graduatedPercentageRange.units)}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {intlFormatNumber(Number(graduatedPercentageRange?.rate || 0) / 100 || 0, {
                  maximumFractionDigits: 2,
                  style: 'percent',
                })}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {fee?.appliedTaxes?.length
                  ? fee?.appliedTaxes.map((appliedTaxes) => (
                      <Typography
                        key={`fee-${fee?.id}-applied-taxe-${appliedTaxes.id}`}
                        variant="body"
                        color="grey600"
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
              <Typography variant="body" color="grey600">
                {intlFormatNumber(Number(graduatedPercentageRange.perUnitTotalAmount || 0), {
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
          </tr>
        ))}

        {!!fee?.amountDetails?.graduatedPercentageRanges?.length &&
          fee?.amountDetails?.graduatedPercentageRanges?.map((graduatedPercentageRange, i) => {
            if (Number(graduatedPercentageRange?.flatUnitAmount) === 0) return null

            return (
              <tr
                key={`fee-${fee.id}-graduated-percentage-range-flat-fee-${i}`}
                className="details-line"
              >
                <td>
                  <Typography variant="body" color="grey600">
                    {i === 0
                      ? translate('text_659e67cd63512ef53284310e', {
                          toValue: Number(graduatedPercentageRange?.toValue),
                        })
                      : i === (fee?.amountDetails?.graduatedPercentageRanges?.length || 0) - 1
                        ? translate('text_659e67cd63512ef53284314a', {
                            fromValue: Number(graduatedPercentageRange?.fromValue),
                          })
                        : translate('text_659e67cd63512ef532843136', {
                            fromValue: Number(graduatedPercentageRange?.fromValue),
                            toValue: Number(graduatedPercentageRange?.toValue),
                          })}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color="grey600">
                    1
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color="grey600">
                    {intlFormatNumber(Number(graduatedPercentageRange?.flatUnitAmount) || 0, {
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </td>
                <td>
                  <Typography variant="body" color="grey600">
                    {fee?.appliedTaxes?.length
                      ? fee?.appliedTaxes.map((appliedTaxes) => (
                          <Typography
                            key={`fee-${fee?.id}-applied-taxe-${appliedTaxes.id}`}
                            variant="body"
                            color="grey600"
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
                  <Typography variant="body" color="grey600">
                    {intlFormatNumber(Number(graduatedPercentageRange.flatUnitAmount || 0), {
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </td>
              </tr>
            )
          })}
      </>
    )
  },
)

InvoiceDetailsTableBodyLineGraduatedPercentage.displayName =
  'InvoiceDetailsTableBodyLineGraduatedPercentage'
