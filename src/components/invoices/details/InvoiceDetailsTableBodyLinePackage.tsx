import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { memo, RefObject } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { ViewFeeDetailsDrawerRef } from '~/components/invoices/details/ViewFeeDetailsDrawer'
import { FeeMetadata } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, FeeForInvoiceDetailsTableBodyLineFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FeeActionsCell, openViewFeeDetailsDrawer } from './FeeActionsCell'

gql`
  fragment FeeForInvoiceDetailsTableBodyLinePackage on Fee {
    id
    units
    amountCents
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      freeUnits
      paidUnits
      perPackageSize
      perPackageUnitAmount
    }
    pricingUnitUsage {
      amountCents
      shortName
    }
  }
`

type InvoiceDetailsTableBodyLinePackageProps = {
  currency: CurrencyEnum
  fee: (FeeForInvoiceDetailsTableBodyLineFragment & { metadata: FeeMetadata }) | undefined
  hideVat?: boolean
  viewFeeDetailsDrawerRef?: RefObject<ViewFeeDetailsDrawerRef>
}

export const InvoiceDetailsTableBodyLinePackage = memo(
  ({
    currency,
    fee,
    hideVat,
    viewFeeDetailsDrawerRef,
  }: InvoiceDetailsTableBodyLinePackageProps) => {
    const { translate } = useInternationalization()
    const amountDetails = fee?.amountDetails

    const handleRowClick = () => openViewFeeDetailsDrawer(fee, viewFeeDetailsDrawerRef)
    const rowClickableClass = fee ? 'cursor-pointer hover:bg-grey-100' : undefined

    return (
      <>
        {Number(amountDetails?.freeUnits || 0) > 0 && (
          <tr
            className={tw('details-line', rowClickableClass)}
            onClick={fee ? handleRowClick : undefined}
          >
            <td>
              <Typography variant="body" color="grey600">
                {translate('text_659e67cd63512ef53284303c', {
                  freeUnits: Number(amountDetails?.freeUnits || 0),
                })}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {Number(amountDetails?.freeUnits || 0)}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {intlFormatNumber(0, {
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
                {intlFormatNumber(0, {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
            <FeeActionsCell fee={fee} viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef} />
          </tr>
        )}

        <tr
          className={tw('details-line', rowClickableClass)}
          onClick={fee ? handleRowClick : undefined}
        >
          <td>
            <Typography variant="body" color="grey600">
              {translate('text_659e67cd63512ef532843064')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {Number(amountDetails?.paidUnits || 0)}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {translate('text_659e67cd63512ef532843074', {
                perPackageUnitAmount: intlFormatNumber(
                  Number(amountDetails?.perPackageUnitAmount) || 0,
                  {
                    pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                    currencyDisplay: 'symbol',
                    currency,
                    minimumFractionDigits: 2,
                    maximumSignificantDigits: 6,
                  },
                ),
                perPackageSize: Number(amountDetails?.perPackageSize || 0),
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
              {intlFormatNumber(
                deserializeAmount(
                  Number(fee?.pricingUnitUsage?.amountCents || fee?.amountCents || 0),
                  currency,
                ),
                {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                },
              )}
            </Typography>
          </td>
          <FeeActionsCell fee={fee} viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef} />
        </tr>
      </>
    )
  },
)

InvoiceDetailsTableBodyLinePackage.displayName = 'InvoiceDetailsTableBodyLinePackage'
