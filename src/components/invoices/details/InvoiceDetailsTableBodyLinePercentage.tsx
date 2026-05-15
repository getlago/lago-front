import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { memo, RefObject } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { ViewFeeDetailsDrawerRef } from '~/components/invoices/details/ViewFeeDetailsDrawer'
import { FeeMetadata } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, FeeForInvoiceDetailsTableBodyLineFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FeeActionsCell, openViewFeeDetailsDrawer } from './FeeActionsCell'

gql`
  fragment FeeForInvoiceDetailsTableBodyLinePercentage on Fee {
    id
    units
    amountCents
    appliedTaxes {
      id
      taxRate
    }
    amountDetails {
      fixedFeeTotalAmount
      fixedFeeUnitAmount
      freeEvents
      freeUnits
      minMaxAdjustmentTotalAmount
      paidEvents
      paidUnits
      perUnitTotalAmount
      rate
      units
    }
    pricingUnitUsage {
      shortName
    }
  }
`

type InvoiceDetailsTableBodyLinePercentageProps = {
  currency: CurrencyEnum
  fee: (FeeForInvoiceDetailsTableBodyLineFragment & { metadata: FeeMetadata }) | undefined
  hideVat?: boolean
  viewFeeDetailsDrawerRef?: RefObject<ViewFeeDetailsDrawerRef>
}

export const InvoiceDetailsTableBodyLinePercentage = memo(
  ({
    currency,
    fee,
    hideVat,
    viewFeeDetailsDrawerRef,
  }: InvoiceDetailsTableBodyLinePercentageProps) => {
    const { translate } = useInternationalization()
    const {
      freeEvents,
      freeUnits,
      paidUnits,
      rate,
      perUnitTotalAmount,
      fixedFeeUnitAmount,
      fixedFeeTotalAmount,
      paidEvents,
      minMaxAdjustmentTotalAmount,
    } = fee?.amountDetails || {}

    const handleRowClick = () => openViewFeeDetailsDrawer(fee, viewFeeDetailsDrawerRef)
    const rowClickableClass = fee ? 'cursor-pointer hover:bg-grey-100' : undefined

    return (
      <>
        {Number(freeUnits || 0) > 0 && (
          <tr
            className={tw('details-line', rowClickableClass)}
            onClick={fee ? handleRowClick : undefined}
          >
            <td>
              <Typography variant="body" color="grey600">
                {translate(
                  'text_659e67cd63512ef532843046',
                  {
                    freeEvents: Number(freeEvents || 0),
                  },
                  Number(freeEvents || 0),
                )}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {Number(freeUnits || 0)}
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
              {translate('text_659e67cd63512ef53284306e')}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {Number(paidUnits || 0)}
            </Typography>
          </td>
          <td>
            <Typography variant="body" color="grey600">
              {rate}%
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
              {intlFormatNumber(Number(perUnitTotalAmount || 0), {
                pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                currencyDisplay: 'symbol',
                currency,
              })}
            </Typography>
          </td>
          <FeeActionsCell fee={fee} viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef} />
        </tr>

        {(Number(fixedFeeUnitAmount || 0) > 0 || Number(fixedFeeTotalAmount || 0) > 0) && (
          <tr
            className={tw('details-line', rowClickableClass)}
            onClick={fee ? handleRowClick : undefined}
          >
            <td>
              <Typography variant="body" color="grey600">
                {translate('text_659e67cd63512ef53284308f')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {paidEvents || 0}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {intlFormatNumber(Number(fixedFeeUnitAmount || 0), {
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
                {intlFormatNumber(Number(fixedFeeTotalAmount || 0), {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
            <FeeActionsCell fee={fee} viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef} />
          </tr>
        )}

        {Number(minMaxAdjustmentTotalAmount || 0) !== 0 && (
          <tr
            className={tw('details-line', rowClickableClass)}
            onClick={fee ? handleRowClick : undefined}
          >
            <td>
              <Typography variant="body" color="grey600">
                {translate('text_659e67cd63512ef5328430ad')}
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                1
              </Typography>
            </td>
            <td>
              <Typography variant="body" color="grey600">
                {intlFormatNumber(Number(minMaxAdjustmentTotalAmount || 0), {
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
                {intlFormatNumber(Number(minMaxAdjustmentTotalAmount || 0), {
                  pricingUnitShortName: fee?.pricingUnitUsage?.shortName,
                  currencyDisplay: 'symbol',
                  currency,
                })}
              </Typography>
            </td>
            <FeeActionsCell fee={fee} viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef} />
          </tr>
        )}
      </>
    )
  },
)

InvoiceDetailsTableBodyLinePercentage.displayName = 'InvoiceDetailsTableBodyLinePercentage'
