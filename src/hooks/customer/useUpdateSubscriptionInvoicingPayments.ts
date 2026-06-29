import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import {
  SubscriptionUpdateFormOptions,
  useUpdateSubscriptionForm,
} from '~/hooks/customer/useUpdateSubscriptionForm'

export const useUpdateSubscriptionInvoicingPayments = ({
  subscription,
  onSuccess,
}: SubscriptionUpdateFormOptions) =>
  useUpdateSubscriptionForm({
    subscription,
    onSuccess,
    buildInput: (value) => ({
      id: subscription?.id ?? '',
      consolidateInvoice: value.consolidateInvoice,
      paymentMethod: value.paymentMethod
        ? {
            paymentMethodId: value.paymentMethod.paymentMethodId,
            paymentMethodType: value.paymentMethod.paymentMethodType,
          }
        : undefined,
      invoiceCustomSection: toInvoiceCustomSectionReference(value.invoiceCustomSection),
      purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber),
    }),
  })
