import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
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
      paymentMethod: value.paymentMethod
        ? {
            paymentMethodId: value.paymentMethod.paymentMethodId,
            paymentMethodType: value.paymentMethod.paymentMethodType,
          }
        : undefined,
      invoiceCustomSection: toInvoiceCustomSectionReference(value.invoiceCustomSection),
    }),
  })
