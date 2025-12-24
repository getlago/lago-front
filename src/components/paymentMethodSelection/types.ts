import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { PaymentMethodReferenceInput } from '~/generated/graphql'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export type SelectedPaymentMethod = PaymentMethodReferenceInput | null | undefined

export interface PaymentMethodComboBoxProps {
  paymentMethodsList?: PaymentMethodList
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  externalCustomerId?: string
  className?: string
  disabled?: boolean
  name?: string
  PopperProps?: ComboBoxProps['PopperProps']
}

export interface PaymentMethodSelectionProps {
  externalCustomerId: string
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  viewType: ViewTypeEnum
  className?: string
  disabled?: boolean
}

export interface EditPaymentMethodDialogProps {
  open: boolean
  onClose: () => void
  selectedPaymentMethod: SelectedPaymentMethod
  setSelectedPaymentMethod: (value: SelectedPaymentMethod) => void
  paymentMethodsList: PaymentMethodList
  viewType: ViewTypeEnum
}
