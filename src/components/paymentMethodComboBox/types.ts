import { PaymentMethodReferenceInput } from '~/generated/graphql'

export type SelectedPaymentMethod = PaymentMethodReferenceInput | null | undefined

export interface PaymentMethodComboBoxProps {
  externalCustomerId: string
  value?: string
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  title: string
  description: string
}
