import { FormikProps } from 'formik'

import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

export type ViewType = 'subscription'

export interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
  formikProps: FormikProps<SubscriptionFormInput>
  viewType: ViewType
}

export interface ViewTypeExtraProps {
  PaymentMethodSelection: {
    title: string
    description: string
  }
  InvoceCustomFooter: {
    title: string
    description: string
  }
}

export type ViewTypeExtraPropsMap = {
  subscription: ViewTypeExtraProps
}
