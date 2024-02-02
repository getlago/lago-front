import { gql } from '@apollo/client'
import { Collapse } from '@mui/material'
import { memo, RefObject, useState } from 'react'

import { Button } from '~/components/designSystem'
import {
  TExtendedRemainingFee,
  TSubscriptionDataForDisplay,
} from '~/core/formats/formatInvoiceItemsMap'
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
  fragment FeeForInvoiceFeeArrearsDetailsTable on Fee {
    id
    ...FeeForInvoiceDetailsTableBodyLine
    ...FeeForDeleteAdjustmentFeeDialog
    ...FeeForEditfeeDrawer
  }

  ${FeeForInvoiceDetailsTableBodyLineFragmentDoc}
  ${FeeForDeleteAdjustmentFeeDialogFragmentDoc}
  ${FeeForEditfeeDrawerFragmentDoc}
`

interface InvoiceFeeArrearsDetailsTableProps {
  subscription: TSubscriptionDataForDisplay['subscription']
  customer: Customer
  canHaveUnitPrice: boolean
  isDraftInvoice: boolean
  currency: CurrencyEnum
  editFeeDrawerRef: RefObject<EditFeeDrawerRef>
  deleteAdjustedFeeDialogRef: RefObject<DeleteAdjustedFeeDialogRef>
}

export const InvoiceFeeArrearsDetailsTable = memo(
  ({
    subscription,
    customer,
    canHaveUnitPrice,
    isDraftInvoice,
    currency,
    editFeeDrawerRef,
    deleteAdjustedFeeDialogRef,
  }: InvoiceFeeArrearsDetailsTableProps) => {
    const { translate } = useInternationalization()
    const [areZeroFeesVisible, setAreZeroFeesVisible] = useState<boolean>(false)

    return (
      <>
        {(subscription.feesInArrears.length > 0 || subscription.feesInArrearsZero.length > 0) && (
          <>
            <InvoiceDetailsTablePeriodLine
              canHaveUnitPrice={canHaveUnitPrice}
              isDraftInvoice={isDraftInvoice}
              period={translate('text_6499a4e4db5730004703f36b', {
                from: formatDateToTZ(
                  subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                    ? subscription?.metadata?.chargesFromDatetime
                    : subscription?.metadata?.fromDatetime,
                  customer?.applicableTimezone,
                  'LLL. dd, yyyy',
                ),
                to: formatDateToTZ(
                  subscription?.metadata?.differentBoundariesForSubscriptionAndCharges
                    ? subscription?.metadata?.chargesToDatetime
                    : subscription?.metadata?.toDatetime,
                  customer?.applicableTimezone,
                  'LLL. dd, yyyy',
                ),
              })}
            />

            {(subscription.feesInArrears as TExtendedRemainingFee[]).map((feeInArrear) => {
              return (
                <InvoiceDetailsTableBodyLine
                  key={`fee-in-arrears-${feeInArrear.id}`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  currency={currency}
                  displayName={feeInArrear?.metadata?.displayName}
                  editFeeDrawerRef={editFeeDrawerRef}
                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                  fee={feeInArrear}
                  isDraftInvoice={isDraftInvoice}
                />
              )
            })}
            {/* Should be only displayed for draft invoices */}
            {subscription.feesInArrearsZero.length > 0 && (
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
                            count: subscription.feesInArrearsZero.length,
                          },
                          subscription.feesInArrearsZero.length,
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
                          {(subscription.feesInArrearsZero as TExtendedRemainingFee[]).map(
                            (feeInArrearZero) => {
                              return (
                                <InvoiceDetailsTableBodyLine
                                  key={`fee-in-arrears-zero-${feeInArrearZero.id}`}
                                  canHaveUnitPrice={canHaveUnitPrice}
                                  currency={currency}
                                  displayName={feeInArrearZero?.metadata?.displayName}
                                  editFeeDrawerRef={editFeeDrawerRef}
                                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                                  fee={feeInArrearZero}
                                  isDraftInvoice={isDraftInvoice}
                                />
                              )
                            },
                          )}
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

InvoiceFeeArrearsDetailsTable.displayName = 'InvoiceFeeArrearsDetailsTable'
