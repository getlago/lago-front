import { gql } from '@apollo/client'
import { Collapse } from '@mui/material'
import { memo, RefObject, useState } from 'react'

import { Button } from '~/components/designSystem'
import { TSubscriptionDataForDisplay } from '~/core/formats/formatInvoiceItemsMap'
import { formatDateToTZ } from '~/core/timezone'
import {
  CurrencyEnum,
  Customer,
  FeeForDeleteAdjustmentFeeDialogFragmentDoc,
  FeeForEditfeeDrawerFragmentDoc,
  FeeForInvoiceDetailsTableBodyLineFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { DeleteAdjustedFeeDialogRef } from './DeleteAdjustedFeeDialog'
import { EditFeeDrawerRef } from './EditFeeDrawer'
import { InvoiceDetailsTableBodyLine } from './InvoiceDetailsTableBodyLine'
import { InvoiceDetailsTableHeader } from './InvoiceDetailsTableHeader'
import { InvoiceDetailsTablePeriodLine } from './InvoiceDetailsTablePeriodLine'

gql`
  fragment FeeForInvoiceFeeAdvanceDetailsTable on Fee {
    id
    ...FeeForInvoiceDetailsTableBodyLine
    ...FeeForDeleteAdjustmentFeeDialog
    ...FeeForEditfeeDrawer
  }

  ${FeeForInvoiceDetailsTableBodyLineFragmentDoc}
  ${FeeForDeleteAdjustmentFeeDialogFragmentDoc}
  ${FeeForEditfeeDrawerFragmentDoc}
`

interface InvoiceFeeAdvanceDetailsTableProps {
  subscription: TSubscriptionDataForDisplay['subscription']
  customer: Customer
  canHaveUnitPrice: boolean
  isDraftInvoice: boolean
  currency: CurrencyEnum
  editFeeDrawerRef: RefObject<EditFeeDrawerRef>
  deleteAdjustedFeeDialogRef: RefObject<DeleteAdjustedFeeDialogRef>
}

export const InvoiceFeeAdvanceDetailsTable = memo(
  ({
    subscription,
    customer,
    canHaveUnitPrice,
    isDraftInvoice,
    currency,
    editFeeDrawerRef,
    deleteAdjustedFeeDialogRef,
  }: InvoiceFeeAdvanceDetailsTableProps) => {
    const { translate } = useInternationalization()
    const [areZeroFeesVisible, setAreZeroFeesVisible] = useState<boolean>(false)

    return (
      <>
        {(subscription.feesInAdvance.length > 0 || subscription.feesInAdvanceZero.length > 0) && (
          <>
            <InvoiceDetailsTablePeriodLine
              canHaveUnitPrice={canHaveUnitPrice}
              isDraftInvoice={isDraftInvoice}
              period={translate('text_6499a4e4db5730004703f36b', {
                from: formatDateToTZ(
                  subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                    ? subscription?.metadata.fromDatetime
                    : subscription?.metadata?.inAdvanceChargesFromDatetime ||
                        subscription?.metadata?.chargesFromDatetime,
                  customer?.applicableTimezone,
                  'LLL dd, yyyy',
                ),
                to: formatDateToTZ(
                  subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                    ? subscription?.metadata.toDatetime
                    : subscription?.metadata?.inAdvanceChargesToDatetime ||
                        subscription?.metadata?.chargesToDatetime,
                  customer?.applicableTimezone,
                  'LLL dd, yyyy',
                ),
              })}
            />
            {subscription.feesInAdvance.map((feeInAdvance) => {
              return (
                <InvoiceDetailsTableBodyLine
                  key={`fee-in-advance-${feeInAdvance.id}`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  currency={currency}
                  displayName={feeInAdvance?.metadata?.displayName}
                  editFeeDrawerRef={editFeeDrawerRef}
                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                  fee={feeInAdvance}
                  isDraftInvoice={isDraftInvoice}
                />
              )
            })}
            {/* Should be only displayed for draft invoices */}
            {subscription.feesInAdvanceZero.length > 0 && (
              <>
                <tr className="collapse">
                  <td colSpan={6}>
                    <div className="collapse-header">
                      <Button
                        variant="quaternary"
                        size="small"
                        startIcon={areZeroFeesVisible ? 'eye-hidden' : 'eye'}
                        onClick={() => setAreZeroFeesVisible(!areZeroFeesVisible)}
                      >
                        {translate(
                          areZeroFeesVisible
                            ? 'text_65b116a266d90732cac8b3bc'
                            : 'text_65b116a266d90732cac8b39b',
                          {
                            count: subscription.feesInAdvanceZero.length,
                          },
                          subscription.feesInAdvanceZero.length,
                        )}
                      </Button>
                    </div>
                    <Collapse in={areZeroFeesVisible} easing="cubic-bezier(0.4, 0, 0.2, 1)">
                      <table className="inner-table">
                        {/* This header is hidden in css. Only present to give the body the correct shape */}
                        <InvoiceDetailsTableHeader
                          canHaveUnitPrice={canHaveUnitPrice}
                          displayName={subscription?.metadata?.subscriptionDisplayName}
                          isDraftInvoice={isDraftInvoice}
                        />
                        <tbody>
                          {subscription.feesInAdvanceZero.map((feeInAdvanceZero) => {
                            return (
                              <InvoiceDetailsTableBodyLine
                                key={`fee-in-advance-zero-${feeInAdvanceZero.id}`}
                                canHaveUnitPrice={canHaveUnitPrice}
                                currency={currency}
                                displayName={feeInAdvanceZero?.metadata?.displayName}
                                editFeeDrawerRef={editFeeDrawerRef}
                                deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                                fee={feeInAdvanceZero}
                                isDraftInvoice={isDraftInvoice}
                              />
                            )
                          })}
                        </tbody>
                      </table>
                    </Collapse>
                  </td>
                </tr>
              </>
            )}
          </>
        )}
      </>
    )
  },
)

InvoiceFeeAdvanceDetailsTable.displayName = 'InvoiceFeeAdvanceDetailsTable'
