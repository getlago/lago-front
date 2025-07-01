/* eslint-disable tailwindcss/no-custom-classname */
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
    pricingUnitUsage {
      shortName
    }
  }
`

type InvoiceDetailsTableBodyLineGraduatedPercentageProps = {
  currency: CurrencyEnum
  fee: TExtendedRemainingFee | undefined
  isDraftInvoice: boolean
  hideVat?: boolean
}

export const InvoiceDetailsTableBodyLineGraduatedPercentage = memo(
  ({
    currency,
    fee,
    isDraftInvoice,
    hideVat,
  }: InvoiceDetailsTableBodyLineGraduatedPercentageProps) => {
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
                {(fee?.amountDetails?.graduatedPercentageRanges?.length || 0) === 1
                  ? translate('text_659e67cd63512ef5328430e6', {
                      fromValue: Number(graduatedPercentageRange?.fromValue),
                    })
                  : i === 0
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
            {!hideVat && (
              <td>
                <Typography variant="body" color="grey600">
                  {graduatedPercentageRange?.rate}%
                </Typography>
              </td>
            )}
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
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
            {isDraftInvoice && <td>{/* Action column */}</td>}
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
                    {fee?.amountDetails?.graduatedPercentageRanges?.length || 0
                      ? translate('text_659e67cd63512ef53284314a', {
                          fromValue: Number(graduatedPercentageRange?.fromValue),
                        })
                      : i === 0
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
                      pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </td>
                {!hideVat && (
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
                                style: 'percent',
                              })}
                            </Typography>
                          ))
                        : '0%'}
                    </Typography>
                  </td>
                )}
                <td>
                  <Typography variant="body" color="grey600">
                    {intlFormatNumber(Number(graduatedPercentageRange.flatUnitAmount || 0), {
                      pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                      currencyDisplay: 'symbol',
                      currency,
                    })}
                  </Typography>
                </td>
                {isDraftInvoice && <td>{/* Action column */}</td>}
              </tr>
            )
          })}
      </>
    )
  },
)

InvoiceDetailsTableBodyLineGraduatedPercentage.displayName =
  'InvoiceDetailsTableBodyLineGraduatedPercentage'
