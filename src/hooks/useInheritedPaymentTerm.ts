import { PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { getInheritedPaymentTerm, PaymentTermLevels } from '~/components/paymentTerms/utils'
import { useBillingEntityById } from '~/hooks/useBillingEntitiesOptions'

type UseInheritedPaymentTermParams = {
  customer: PaymentTermLevels['customer']
  billingEntityId: string | null | undefined
}

// The customer's own term wins over any billing entity's, so the issuing entity is only
// looked up when the customer has none. `undefined` while the inherited term is unknown.
export const useInheritedPaymentTerm = ({
  customer,
  billingEntityId,
}: UseInheritedPaymentTermParams): PaymentTermInheritedFrom | undefined => {
  const { billingEntity, status } = useBillingEntityById(
    customer?.paymentTerm ? undefined : billingEntityId,
  )

  if (!customer || status !== 'resolved') return undefined

  return getInheritedPaymentTerm({ customer, issuingBillingEntity: billingEntity })
}
