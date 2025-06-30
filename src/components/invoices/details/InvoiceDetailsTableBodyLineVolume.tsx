/* eslint-disable tailwindcss/no-custom-classname */
import { gql } from '@apollo/client'
import { memo } from 'react'

import { Typography } from '~/components/designSystem'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment FeeForInvoiceDetailsTableBodyLineVolume on Fee {
    id
    units
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      flatUnitAmount
      perUnitAmount
      perUnitTotalAmount
    }
    pricingUnitUsage {
      shortName
    }
  }
`

type InvoiceDetailsTableBodyLineVolumeProps = {
  currency: CurrencyEnum
  fee: TExtendedRemainingFee | undefined
  isDraftInvoice: boolean
  hideVat?: boolean
}

export const InvoiceDetailsTableBodyLineVolume = memo(
  ({ currency, fee, isDraftInvoice, hideVat }: InvoiceDetailsTableBodyLineVolumeProps) => {
    const { translate } = useInternationalization()
    const amountDetails = fee?.amountDetails

    return (
      <>
        <tr className="details-line">
          <td>
            <Typography variant="body" color="grey600">
              {translate('text_659e67cd63512ef532843078')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {Number(fee?.units || 0)}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {intlFormatNumber(Number(amountDetails?.perUnitAmount) || 0, {
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
              {intlFormatNumber(Number(amountDetails?.perUnitTotalAmount || 0), {
                pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                currencyDisplay: 'symbol',
                currency,
              })}
            </Typography>
          </td>
          {isDraftInvoice && <td>{/* Action column */}</td>}
        </tr>

        {Number(amountDetails?.flatUnitAmount || 0) > 0 && (
          <>
            <tr className="details-line">
              <td>
                <Typography variant="body" color="grey600">
                  {translate('text_659e67cd63512ef5328430b5')}
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="grey600">
                  1
                </Typography>
              </td>
              <td>
                <Typography variant="body" color="grey600">
                  {intlFormatNumber(Number(amountDetails?.flatUnitAmount) || 0, {
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
                  {intlFormatNumber(Number(amountDetails?.flatUnitAmount || 0), {
                    pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                    currencyDisplay: 'symbol',
                    currency,
                  })}
                </Typography>
              </td>
              {isDraftInvoice && <td>{/* Action column */}</td>}
            </tr>
          </>
        )}
      </>
    )
  },
)

InvoiceDetailsTableBodyLineVolume.displayName = 'InvoiceDetailsTableBodyLineVolume'
