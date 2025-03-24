import { envGlobalVar } from '~/core/apolloClient'
import {
  Invoice,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
} from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'

const { disablePdfGeneration } = envGlobalVar()

export const usePermissionsInvoiceActions = () => {
  const { hasPermissions } = usePermissions()

  const canDownload = (invoice: Pick<Invoice, 'status' | 'taxStatus'>): boolean => {
    return (
      ![
        InvoiceStatusTypeEnum.Draft,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ].includes(invoice.status) &&
      invoice.taxStatus !== InvoiceTaxStatusTypeEnum.Pending &&
      hasPermissions(['invoicesView']) &&
      !disablePdfGeneration
    )
  }

  const canFinalize = (invoice: Pick<Invoice, 'status'>): boolean => {
    return (
      ![
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
        InvoiceStatusTypeEnum.Finalized,
      ].includes(invoice.status) && hasPermissions(['invoicesUpdate'])
    )
  }

  const canRetryCollect = (invoice: Pick<Invoice, 'status' | 'paymentStatus'>): boolean => {
    return (
      invoice.status === InvoiceStatusTypeEnum.Finalized &&
      [InvoicePaymentStatusTypeEnum.Failed, InvoicePaymentStatusTypeEnum.Pending].includes(
        invoice.paymentStatus,
      ) &&
      hasPermissions(['invoicesSend'])
    )
  }

  const canUpdatePaymentStatus = (invoice: Pick<Invoice, 'status' | 'taxStatus'>): boolean => {
    return (
      ![
        InvoiceStatusTypeEnum.Draft,
        InvoiceStatusTypeEnum.Voided,
        InvoiceStatusTypeEnum.Failed,
        InvoiceStatusTypeEnum.Pending,
      ].includes(invoice.status) &&
      invoice.taxStatus !== InvoiceTaxStatusTypeEnum.Pending &&
      hasPermissions(['invoicesUpdate'])
    )
  }

  const canVoid = (invoice: Pick<Invoice, 'status' | 'paymentStatus'>): boolean => {
    return (
      invoice.status === InvoiceStatusTypeEnum.Finalized &&
      [InvoicePaymentStatusTypeEnum.Pending, InvoicePaymentStatusTypeEnum.Failed].includes(
        invoice.paymentStatus,
      ) &&
      hasPermissions(['invoicesVoid'])
    )
  }

  const canIssueCreditNote = (invoice: Pick<Invoice, 'status'>): boolean => {
    return (
      ![InvoiceStatusTypeEnum.Draft, InvoiceStatusTypeEnum.Voided].includes(invoice.status) &&
      hasPermissions(['creditNotesCreate'])
    )
  }

  const canRecordPayment = (
    invoice: Pick<Invoice, 'totalDueAmountCents' | 'totalPaidAmountCents' | 'totalAmountCents'>,
  ): boolean => {
    return (
      Number(invoice.totalDueAmountCents) > 0 &&
      hasPermissions(['paymentsCreate']) &&
      Number(invoice.totalPaidAmountCents) < Number(invoice.totalAmountCents)
    )
  }

  const canDispute = (invoice: Pick<Invoice, 'status' | 'paymentDisputeLostAt'>): boolean => {
    return (
      invoice.status === InvoiceStatusTypeEnum.Finalized &&
      invoice.paymentDisputeLostAt &&
      hasPermissions(['invoicesUpdate'])
    )
  }

  const canSyncAccountingIntegration = (invoice: Pick<Invoice, 'integrationSyncable'>): boolean => {
    return !!invoice.integrationSyncable
  }

  const canSyncCRMIntegration = (invoice: Pick<Invoice, 'integrationHubspotSyncable'>): boolean => {
    return !!invoice.integrationHubspotSyncable
  }

  const canSyncTaxIntegration = (invoice: Pick<Invoice, 'taxProviderVoidable'>): boolean => {
    return !!invoice.taxProviderVoidable
  }

  return {
    canDownload,
    canFinalize,
    canRetryCollect,
    canUpdatePaymentStatus,
    canVoid,
    canIssueCreditNote,
    canRecordPayment,
    canDispute,
    canSyncAccountingIntegration,
    canSyncCRMIntegration,
    canSyncTaxIntegration,
  }
}
