import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { PaymentMethodReferenceInput } from '~/generated/graphql'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { ViewType } from '../paymentMethodsInvoiceSettings/types'

export type SelectedPaymentMethod = PaymentMethodReferenceInput | null | undefined

export interface PaymentMethodComboBoxProps {
  paymentMethodsList: PaymentMethodList
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  className?: string
  disabled?: boolean
  name?: string
  PopperProps?: ComboBoxProps['PopperProps']
}

export interface PaymentMethodSelectionProps {
  externalCustomerId: string
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  title: string
  description: string
  viewType: ViewType
  className?: string
  disabled?: boolean
}

export interface EditPaymentMethodDialogProps {
  open: boolean
  onClose: () => void
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  paymentMethodsList: PaymentMethodList
  viewType: ViewType
}
