import { Payable } from '~/core/types/payable'

/**
 * Type guard to check if a payable is an Invoice
 *
 * @param payable - The payable object to check
 * @returns True if the payable is an Invoice, false otherwise
 */
export const isInvoice = (
  payable: Payable,
): payable is Extract<Payable, { __typename?: 'Invoice' }> => {
  return payable.payableType === 'Invoice'
}

/**
 * Type guard to check if a payable is a PaymentRequest
 *
 * @param payable - The payable object to check
 * @returns True if the payable is a PaymentRequest, false otherwise
 */
export const isPaymentRequest = (
  payable: Payable,
): payable is Extract<Payable, { __typename?: 'PaymentRequest' }> => {
  return payable.payableType === 'PaymentRequest'
}

/**
 * The invoice number a payable is identified by, for naming a row link whose
 * first cell only shows the payment status.
 */
export const getPayableNumber = (payable: Payable): string => {
  if (isInvoice(payable)) {
    return payable.number ?? ''
  }

  if (isPaymentRequest(payable)) {
    return payable.invoices[0]?.number ?? ''
  }

  return ''
}
