import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { DateTime } from 'luxon'
import { FC, memo, ReactNode, RefObject } from 'react'

import { Button } from '~/components/designSystem'
import { DeleteAdjustedFeeDialogRef } from '~/components/invoices/details/DeleteAdjustedFeeDialog'
import { EditFeeDrawerRef } from '~/components/invoices/details/EditFeeDrawer'
import { InvoiceDetailsTableBodyLine } from '~/components/invoices/details/InvoiceDetailsTableBodyLine'
import { InvoiceDetailsTableFooter } from '~/components/invoices/details/InvoiceDetailsTableFooter'
import { InvoiceDetailsTableHeader } from '~/components/invoices/details/InvoiceDetailsTableHeader'
import { InvoiceDetailsTablePeriodLine } from '~/components/invoices/details/InvoiceDetailsTablePeriodLine'
import { InvoiceFeeAdvanceDetailsTable } from '~/components/invoices/details/InvoiceFeeAdvanceDetailsTable'
import { InvoiceFeeArrearsDetailsTable } from '~/components/invoices/details/InvoiceFeeArrearsDetailsTable'
import { groupAndFormatFees, TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  Customer,
  ErrorCodesEnum,
  FeeForInvoiceDetailsTableBodyLineFragmentDoc,
  FeeForInvoiceFeeAdvanceDetailsTableFragmentDoc,
  FeeForInvoiceFeeArrearsDetailsTableFragmentDoc,
  InvoiceForDetailsTableFooterFragmentDoc,
  InvoiceForDetailsTableFragment,
  InvoiceStatusTypeEnum,
  InvoiceSubscription,
  InvoiceSubscriptionFormatingFragmentDoc,
  InvoiceTypeEnum,
  PremiumIntegrationTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment FeeForInvoiceDetailsTable on Fee {
    id
    amountCents
    description
    feeType
    invoiceDisplayName
    invoiceName
    itemName
    units
    preciseUnitAmount
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
      invoiceDisplayName
      billableMetric {
        id
        name
        aggregationType
      }
    }
    chargeFilter {
      invoiceDisplayName
      values
    }

    ...FeeForInvoiceDetailsTableBodyLine
    ...FeeForInvoiceFeeArrearsDetailsTable
    ...FeeForInvoiceFeeAdvanceDetailsTable
  }

  fragment InvoiceForDetailsTable on Invoice {
    invoiceType
    subTotalExcludingTaxesAmountCents
    subTotalIncludingTaxesAmountCents
    totalAmountCents
    currency
    issuingDate
    allChargesHaveFees
    versionNumber
    errorDetails {
      errorCode
      errorDetails
    }
    fees {
      id
      ...FeeForInvoiceDetailsTable
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
      acceptNewChargeFees
      subscription {
        id
        name
        plan {
          id
          name
          interval
          amountCents
          amountCurrency
          invoiceDisplayName
        }
      }
      fees {
        id
        subscription {
          id
          name
          plan {
            id
            name
            invoiceDisplayName
          }
        }
        ...FeeForInvoiceDetailsTable
      }

      ...InvoiceSubscriptionFormating
    }

    ...InvoiceForDetailsTableFooter
  }

  ${InvoiceSubscriptionFormatingFragmentDoc}
  ${InvoiceForDetailsTableFooterFragmentDoc}
  ${FeeForInvoiceDetailsTableBodyLineFragmentDoc}
  ${FeeForInvoiceFeeArrearsDetailsTableFragmentDoc}
  ${FeeForInvoiceFeeAdvanceDetailsTableFragmentDoc}
`

interface InvoiceDetailsTableProps {
  customer: Customer
  invoice: InvoiceForDetailsTableFragment
  editFeeDrawerRef: RefObject<EditFeeDrawerRef>
  deleteAdjustedFeeDialogRef: RefObject<DeleteAdjustedFeeDialogRef>
}

export const InvoiceTableSection: FC<{
  children: ReactNode
  isDraftInvoice?: boolean
  canHaveUnitPrice?: boolean
  className?: string
}> = ({ children, isDraftInvoice, canHaveUnitPrice, className }) => {
  const tableHeadClasses = tw(
    '[&_table>thead>tr>th]:sticky [&_table>thead>tr>th]:top-[theme("spacing.nav")] [&_table>thead>tr>th]:z-10 [&_table>thead>tr>th]:bg-white [&_table>thead>tr>th]:pb-3 [&_table>thead>tr>th]:pt-8 [&_table>thead>tr>th]:shadow-b',
    '[&_table>thead>tr>th:not(:first-child)]:line-break-anywhere [&_table>thead>tr>th:not(:last-child)]:pr-3 [&_table>thead>tr>th:nth-child(1)]:text-left [&_table>thead>tr>th]:overflow-hidden [&_table>thead>tr>th]:text-right',
  )

  const tableBodyClasses = tw(
    '[&_table>tbody>tr>td:not(:first-child)]:line-break-anywhere [&_table>tbody>tr>td:not(:last-child)]:pr-3 [&_table>tbody>tr>td:nth-child(1)]:text-left',
    '[&_table>tbody>tr>td]:min-h-11 [&_table>tbody>tr>td]:overflow-hidden [&_table>tbody>tr>td]:py-3 [&_table>tbody>tr>td]:text-right [&_table>tbody>tr>td]:align-top [&_table>tbody>tr>td]:shadow-b',
    '[&_table>tbody>tr.has-details>td]:min-h-6 [&_table>tbody>tr.has-details>td]:pb-1 [&_table>tbody>tr.has-details>td]:pl-0 [&_table>tbody>tr.has-details>td]:pr-3 [&_table>tbody>tr.has-details>td]:pt-3 [&_table>tbody>tr.has-details>td]:shadow-none',
    '[&_table>tbody>tr.details-line>td:last-child]:pr-0 [&_table>tbody>tr.details-line>td]:min-h-6 [&_table>tbody>tr.details-line>td]:py-1 [&_table>tbody>tr.details-line>td]:pl-4 [&_table>tbody>tr.details-line>td]:pr-3 [&_table>tbody>tr.details-line>td]:align-top [&_table>tbody>tr.details-line>td]:shadow-none',
    '[&_table>tbody>tr.subtotal>td:last-child]:pr-0 [&_table>tbody>tr.subtotal>td]:pb-3 [&_table>tbody>tr.subtotal>td]:pl-4 [&_table>tbody>tr.subtotal>td]:pr-3 [&_table>tbody>tr.subtotal>td]:pt-1 [&_table>tbody>tr.subtotal>td]:shadow-b',
    '[&_table>tbody>tr.line-collapse>td]:!p-0 [&_table>tbody>tr.line-collapse>td_.collapse-header]:block [&_table>tbody>tr.line-collapse>td_.collapse-header]:w-full [&_table>tbody>tr.line-collapse>td_.collapse-header]:py-3 [&_table>tbody>tr.line-collapse>td_.collapse-header]:shadow-b',
  )

  const tableFootClasses = tw(
    '[&_table>tfoot>tr>td]:px-0 [&_table>tfoot>tr>td]:py-3 [&_table>tfoot>tr>td]:text-right',
    '[&_table>tfoot>tr>td:nth-child(2)]:text-left [&_table>tfoot>tr>td:nth-child(2)]:shadow-b [&_table>tfoot>tr>td:nth-child(3)]:shadow-b [&_table>tfoot>tr>td:nth-child(3)]:line-break-anywhere',
    '[&_table>tfoot>tr>td:nth-child(1)]:w-[50%] [&_table>tfoot>tr>td:nth-child(2)]:w-[35%] [&_table>tfoot>tr>td:nth-child(3)]:w-[15%]',
  )

  let tableStructureClasses: string

  if (isDraftInvoice) {
    tableStructureClasses = tw(
      '[&_table>thead>tr>th:nth-child(1)]:w-[45%] [&_table>thead>tr>th:nth-child(2)]:w-[15%] [&_table>thead>tr>th:nth-child(3)]:w-[15%] [&_table>thead>tr>th:nth-child(4)]:w-[10%] [&_table>thead>tr>th:nth-child(5)]:w-[15%] [&_table>thead>tr>th:nth-child(6)]:w-6 [&_table>thead>tr>th:nth-child(6)]:overflow-visible',
      '[&_table>tbody>tr>td:nth-child(1)]:w-[45%] [&_table>tbody>tr>td:nth-child(2)]:w-[15%] [&_table>tbody>tr>td:nth-child(3)]:w-[15%] [&_table>tbody>tr>td:nth-child(4)]:w-[10%] [&_table>tbody>tr>td:nth-child(5)]:w-[15%] [&_table>tbody>tr>td:nth-child(6)]:w-6 [&_table>tbody>tr>td:nth-child(6)]:overflow-visible',
      '[&_table>tbody>tr>td:last-child]:size-6 [&_table>tbody>tr>td:last-child]:overflow-visible [&_table>tbody>tr>td:last-child]:pr-0 [&_table>tbody>tr>td:last-child]:pt-[10px] [&_table>tbody>tr>td:nth-last-child(2)]:!pr-3',
    )
  } else if (canHaveUnitPrice) {
    tableStructureClasses = tw(
      '[&_table>thead>tr>th:nth-child(1)]:w-[45%] [&_table>thead>tr>th:nth-child(2)]:w-[15%] [&_table>thead>tr>th:nth-child(3)]:w-[15%] [&_table>thead>tr>th:nth-child(4)]:w-[10%] [&_table>thead>tr>th:nth-child(5)]:w-[15%]',
      '[&_table>tbody>tr>td:nth-child(1)]:w-[45%] [&_table>tbody>tr>td:nth-child(2)]:w-[15%] [&_table>tbody>tr>td:nth-child(3)]:w-[15%] [&_table>tbody>tr>td:nth-child(4)]:w-[10%] [&_table>tbody>tr>td:nth-child(5)]:w-[15%]',
    )
  } else {
    tableStructureClasses = tw(
      '[&_table>thead>tr>th:nth-child(1)]:w-[50%] [&_table>thead>tr>th:nth-child(2)]:w-[20%] [&_table>thead>tr>th:nth-child(3)]:w-[10%] [&_table>thead>tr>th:nth-child(4)]:w-[20%]',
      '[&_table>tbody>tr>td:nth-child(1)]:w-[50%] [&_table>tbody>tr>td:nth-child(2)]:w-[20%] [&_table>tbody>tr>td:nth-child(3)]:w-[10%] [&_table>tbody>tr>td:nth-child(4)]:w-[20%]',
    )
  }

  return (
    <section
      className={tw(
        '[&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse',
        tableHeadClasses,
        tableBodyClasses,
        tableFootClasses,
        tableStructureClasses,
        className,
      )}
    >
      {children}
    </section>
  )
}

export const InvoiceDetailsTable = memo(
  ({
    customer,
    editFeeDrawerRef,
    deleteAdjustedFeeDialogRef,
    invoice,
  }: InvoiceDetailsTableProps) => {
    const { translate } = useInternationalization()
    const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()
    const currency = invoice?.currency || CurrencyEnum.Usd
    const isDraftInvoice = invoice?.status === InvoiceStatusTypeEnum.Draft
    const canHaveUnitPrice = invoice.versionNumber >= 4 || isDraftInvoice
    const hasOldZeroFeeManagement = !!premiumIntegrations?.includes(
      PremiumIntegrationTypeEnum.ZeroAmountFees,
    )

    const hasTaxProviderError = !!invoice.errorDetails?.find(
      ({ errorCode }) => errorCode === ErrorCodesEnum.TaxError,
    )

    /******************
     * One-off invoice
     ******************/
    if (
      [
        InvoiceTypeEnum.AddOn,
        InvoiceTypeEnum.Credit,
        InvoiceTypeEnum.OneOff,
        InvoiceTypeEnum.AdvanceCharges,
      ].includes(invoice.invoiceType)
    ) {
      return (
        <InvoiceTableSection isDraftInvoice={isDraftInvoice} canHaveUnitPrice={canHaveUnitPrice}>
          <table>
            <InvoiceDetailsTableHeader
              canHaveUnitPrice={canHaveUnitPrice}
              displayName={translate('text_6388b923e514213fed58331c')}
              isDraftInvoice={isDraftInvoice}
            />
            <tbody>
              {invoice.fees?.map((fee, i) => (
                <InvoiceDetailsTableBodyLine
                  key={`one-off-fee-${i}`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  currency={currency}
                  displayName={
                    invoice.invoiceType === InvoiceTypeEnum.AddOn
                      ? translate('text_6388baa2e514213fed583611', { name: fee.itemName })
                      : invoice.invoiceType === InvoiceTypeEnum.OneOff ||
                          invoice.invoiceType === InvoiceTypeEnum.AdvanceCharges
                        ? fee.invoiceDisplayName || fee.itemName
                        : translate('text_637ccf8133d2c9a7d11ce6e1')
                  }
                  succeededDate={
                    invoice.invoiceType === InvoiceTypeEnum.AdvanceCharges
                      ? DateTime.fromISO(fee.succeededAt).toFormat('LLL. dd, yyyy')
                      : undefined
                  }
                  editFeeDrawerRef={editFeeDrawerRef}
                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                  isDraftInvoice={isDraftInvoice}
                  fee={fee as TExtendedRemainingFee}
                  hasTaxProviderError={hasTaxProviderError}
                />
              ))}
            </tbody>
            <InvoiceDetailsTableFooter
              invoice={invoice}
              canHaveUnitPrice={canHaveUnitPrice}
              hasTaxProviderError={hasTaxProviderError}
            />
          </table>
        </InvoiceTableSection>
      )
    }

    const newFormattedInvoiceItemsMap = groupAndFormatFees({
      invoiceSubscriptions: invoice?.invoiceSubscriptions as InvoiceSubscription[],
      hasOldZeroFeeManagement,
    })

    /*********************
     * No fee placeholder
     *********************/
    if (
      (invoice.status === InvoiceStatusTypeEnum.Draft &&
        !newFormattedInvoiceItemsMap?.metadata?.hasAnyFeeParsed) ||
      (invoice.status !== InvoiceStatusTypeEnum.Draft &&
        !newFormattedInvoiceItemsMap?.metadata?.hasAnyPositiveFeeParsed)
    ) {
      return (
        <>
          {Object.entries(newFormattedInvoiceItemsMap.subscriptions).map(
            ([subscriptionId, subscription]) => {
              return (
                <InvoiceTableSection
                  key={`subscription-placeholder-for-${subscriptionId}`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  isDraftInvoice={false}
                >
                  <table>
                    <InvoiceDetailsTableHeader
                      canHaveUnitPrice={canHaveUnitPrice}
                      displayName={subscription?.metadata?.subscriptionDisplayName}
                      isDraftInvoice={false}
                    />
                    <tbody>
                      <InvoiceDetailsTablePeriodLine
                        canHaveUnitPrice={canHaveUnitPrice}
                        isDraftInvoice={false}
                        period={translate('text_6499a4e4db5730004703f36b', {
                          from: intlFormatDateTime(subscription?.metadata?.fromDatetime, {
                            timezone: customer?.applicableTimezone,
                          }).date,
                          to: intlFormatDateTime(subscription?.metadata?.toDatetime, {
                            timezone: customer?.applicableTimezone,
                          }).date,
                        })}
                      />

                      <InvoiceDetailsTableBodyLine
                        canHaveUnitPrice={canHaveUnitPrice}
                        currency={currency}
                        displayName={subscription?.metadata?.subscriptionDisplayName}
                        editFeeDrawerRef={editFeeDrawerRef}
                        deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                        fee={undefined}
                        isDraftInvoice={false}
                        hasTaxProviderError={hasTaxProviderError}
                      />
                    </tbody>

                    <InvoiceDetailsTableFooter
                      invoice={invoice}
                      canHaveUnitPrice={canHaveUnitPrice}
                      hasTaxProviderError={hasTaxProviderError}
                    />
                  </table>
                </InvoiceTableSection>
              )
            },
          )}
        </>
      )
    }

    /*************
     * Other fees
     *************/
    return (
      <InvoiceTableSection isDraftInvoice={isDraftInvoice} canHaveUnitPrice={canHaveUnitPrice}>
        <div className="[&>table:not(:nth-last-child(2))]:mb-8">
          {Object.entries(newFormattedInvoiceItemsMap.subscriptions).map(
            ([subscriptionId, subscription], subscriptionIndex) => {
              const feesComponentsToRender = [
                <InvoiceFeeArrearsDetailsTable
                  key={`sub-${subscriptionIndex}-invoice-fee-arrears-details-table`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  currency={currency}
                  customer={customer}
                  hasOldZeroFeeManagement={hasOldZeroFeeManagement}
                  editFeeDrawerRef={editFeeDrawerRef}
                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                  isDraftInvoice={isDraftInvoice}
                  subscription={subscription}
                />,
                <InvoiceFeeAdvanceDetailsTable
                  key={`sub-${subscriptionIndex}-invoice-fee-advance-details-table`}
                  canHaveUnitPrice={canHaveUnitPrice}
                  currency={currency}
                  customer={customer}
                  hasOldZeroFeeManagement={hasOldZeroFeeManagement}
                  editFeeDrawerRef={editFeeDrawerRef}
                  deleteAdjustedFeeDialogRef={deleteAdjustedFeeDialogRef}
                  isDraftInvoice={isDraftInvoice}
                  subscription={subscription}
                />,
              ]

              if (subscription.metadata.differentBoundariesForSubscriptionAndCharges) {
                feesComponentsToRender.reverse()
              }

              return (
                <table key={`subscription-${subscriptionId}`}>
                  <InvoiceDetailsTableHeader
                    canHaveUnitPrice={canHaveUnitPrice}
                    displayName={subscription?.metadata?.subscriptionDisplayName}
                    isDraftInvoice={isDraftInvoice}
                  />
                  <tbody>
                    {feesComponentsToRender.map((component) => {
                      return component
                    })}

                    {!hasOldZeroFeeManagement &&
                      !invoice.allChargesHaveFees &&
                      subscription.metadata.acceptNewChargeFees &&
                      invoice.status === InvoiceStatusTypeEnum.Draft && (
                        <tr>
                          <td colSpan={6}>
                            <div>
                              <Button
                                variant="quaternary"
                                size="small"
                                startIcon={'plus'}
                                onClick={() =>
                                  editFeeDrawerRef.current?.openDrawer({
                                    invoiceId: subscription.metadata.invoiceId,
                                    invoiceSubscriptionId: subscriptionId,
                                  })
                                }
                              >
                                {translate('text_1737709105343hobdiidr8r9')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              )
            },
          )}

          {/* Footer */}
          <table>
            <InvoiceDetailsTableFooter
              invoice={invoice}
              canHaveUnitPrice={canHaveUnitPrice}
              hasTaxProviderError={hasTaxProviderError}
            />
          </table>
        </div>
      </InvoiceTableSection>
    )
  },
)

InvoiceDetailsTable.displayName = 'InvoiceDetailsTable'
