import React, { memo } from 'react'
import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem'
import {
  CurrencyEnum,
  Customer,
  InvoiceForDetailsTableFooterFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { ExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'

gql`
  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency
    issuingDate

    ...InvoiceForDetailsTableFooter

    fees {
      id
      amountCents
      itemName
      units
      feeType
      appliedTaxes {
        id
        taxRate
      }
      trueUpFee {
        id
      }
      charge {
        id
        payInAdvance
      }
    }
    customer {
      id
      currency
      applicableTimezone
    }
    invoiceSubscriptions {
      fromDatetime
      toDatetime
      chargesFromDatetime
      chargesToDatetime
      inAdvanceChargesFromDatetime
      inAdvanceChargesToDatetime
      subscription {
        id
        name
        plan {
          id
          name
          interval
          amountCents
          amountCurrency
        }
      }
      fees {
        id
        amountCents
        eventsCount
        units
        feeType
        appliedTaxes {
          id
          taxRate
        }
        trueUpFee {
          id
        }
        trueUpParentFee {
          id
        }
        charge {
          id
          payInAdvance
          billableMetric {
            id
            name
            aggregationType
          }
        }
        group {
          id
          key
          value
        }
      }
    }
  }

  ${InvoiceForDetailsTableFooterFragmentDoc}
`

interface InvoiceDetailsTableFeeItemProps {
  currency: CurrencyEnum
  customer: Customer
  fee: ExtendedRemainingFee
  invoiceSubscriptionIndex: number
  label?: string
  units?: number
}

export const InvoiceDetailsTableFeeItem = memo(
  ({ customer, fee, invoiceSubscriptionIndex, label, units }: InvoiceDetailsTableFeeItemProps) => {
    const { translate } = useInternationalization()

    return (
      <table key={`invoiceSubscription-${invoiceSubscriptionIndex}-fee-${fee.id}`}>
        <tbody>
          <tr>
            <td>
              <Typography variant="body" color="grey700">
                {!!label ? (
                  <>{label}</>
                ) : (
                  <>
                    {fee.isGroupChildFee && fee.charge?.billableMetric?.name
                      ? `${fee.charge?.billableMetric?.name} • `
                      : ''}
                    {fee.displayName}
                    {!!fee.isTrueUpFee ? ` • ${translate('text_64463aaa34904c00a23be4f7')}` : ''}
                  </>
                )}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {!!units ? units : fee.units}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey700">
                {fee.appliedTaxes?.length
                  ? fee.appliedTaxes.map((appliedTaxes) => (
                      <Typography
                        key={`fee-${fee.id}-applied-taxe-${appliedTaxes.id}`}
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
              {
                <Typography variant="body" color="grey700">
                  {intlFormatNumber(
                    deserializeAmount(fee.amountCents || 0, customer?.currency || CurrencyEnum.Usd),
                    {
                      currencyDisplay: 'symbol',
                      currency: customer?.currency || CurrencyEnum.Usd,
                    }
                  )}
                </Typography>
              }
            </td>
          </tr>
        </tbody>
      </table>
    )
  }
)

InvoiceDetailsTableFeeItem.displayName = 'InvoiceDetailsTableFeeItem'
