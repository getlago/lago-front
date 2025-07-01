/* eslint-disable tailwindcss/no-custom-classname */
import { gql } from '@apollo/client'
import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FeeForInvoiceDetailsTableBodyLineGraduated on Fee {
    id
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      graduatedRanges {
        flatUnitAmount
        fromValue
        perUnitAmount
        perUnitTotalAmount
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

type InvoiceDetailsTableBodyLineGraduatedProps = {
  currency: CurrencyEnum
  fee: TExtendedRemainingFee | undefined
  isDraftInvoice: boolean
  hideVat?: boolean
}

export const InvoiceDetailsTableBodyLineGraduated = memo(
  ({ currency, fee, isDraftInvoice, hideVat }: InvoiceDetailsTableBodyLineGraduatedProps) => {
    const { translate } = useInternationalization()

    return (
      <>
        {fee?.amountDetails?.graduatedRanges?.map((graduatedRange, i) => (
          <tr key={`fee-${fee.id}-graduated-range-fee-per-unit-${i}`} className="details-line">
            <td>
              <Typography variant="body" color="grey600">
                {(fee?.amountDetails?.graduatedRanges?.length || 0) === 1
                  ? translate('text_659e67cd63512ef5328430e6', {
                      fromValue: Number(graduatedRange?.fromValue),
                    })
                  : i === 0
                    ? translate('text_659e67cd63512ef532843070', {
                        toValue: Number(graduatedRange?.toValue),
                      })
                    : i === (fee?.amountDetails?.graduatedRanges?.length || 0) - 1
                      ? translate('text_659e67cd63512ef5328430e6', {
                          fromValue: Number(graduatedRange?.fromValue),
                        })
                      : translate('text_659e67cd63512ef5328430af', {
                          fromValue: Number(graduatedRange?.fromValue),
                          toValue: Number(graduatedRange?.toValue),
                        })}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {Number(graduatedRange.units)}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {intlFormatNumber(Number(graduatedRange?.perUnitAmount) || 0, {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                  maximumFractionDigits: 15,
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
                {intlFormatNumber(Number(graduatedRange.perUnitTotalAmount || 0), {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
            {isDraftInvoice && <td>{/* Action column */}</td>}
          </tr>
        ))}

        {!!fee?.amountDetails?.graduatedRanges?.length &&
          fee?.amountDetails?.graduatedRanges?.map((graduatedRange, i) => {
            if (Number(graduatedRange?.flatUnitAmount) === 0) return null

            return (
              <tr key={`fee-${fee.id}-graduated-range-flat-fee-${i}`} className="details-line">
                <td>
                  <Typography variant="body" color="grey600">
                    {(fee?.amountDetails?.graduatedRanges?.length || 0) === 1
                      ? translate('text_659e67cd63512ef53284314a', {
                          fromValue: Number(graduatedRange?.fromValue),
                        })
                      : i === 0
                        ? translate('text_659e67cd63512ef53284310e', {
                            toValue: Number(graduatedRange?.toValue),
                          })
                        : i === (fee?.amountDetails?.graduatedRanges?.length || 0) - 1
                          ? translate('text_659e67cd63512ef53284314a', {
                              fromValue: Number(graduatedRange?.fromValue),
                            })
                          : translate('text_659e67cd63512ef532843136', {
                              fromValue: Number(graduatedRange?.fromValue),
                              toValue: Number(graduatedRange?.toValue),
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
                    {intlFormatNumber(Number(graduatedRange?.flatUnitAmount) || 0, {
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
                    {intlFormatNumber(Number(graduatedRange.flatUnitAmount || 0), {
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

InvoiceDetailsTableBodyLineGraduated.displayName = 'InvoiceDetailsTableBodyLineGraduated'
