import { FormikProps } from 'formik'

import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

export interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
  formikProps: FormikProps<SubscriptionFormInput>
}

export interface PaymentMethodComboBoxExtraProps {
  sectionName: string
  title: string
  description: string
}

export interface InvoceCustomFooterExtraProps {
  sectionName: string
  title: string
  description: string
}

export interface ViewTypeExtraProps {
  PaymentMethodComboBox: PaymentMethodComboBoxExtraProps
  InvoceCustomFooter: InvoceCustomFooterExtraProps
}

export type ViewTypeExtraPropsMap = {
  subscription: ViewTypeExtraProps
}
