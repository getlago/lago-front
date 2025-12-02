import { FormikProps } from 'formik'

import { InvoceCustomFooterExtraProps } from '~/components/invoceCustomFooter/types'
import { PaymentMethodSelectionExtraProps } from '~/components/paymentMethodSelection/types'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

export interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
  formikProps: FormikProps<SubscriptionFormInput>
  viewType: 'subscription'
}

export interface ViewTypeExtraProps {
  PaymentMethodSelection: PaymentMethodSelectionExtraProps
  InvoceCustomFooter: InvoceCustomFooterExtraProps
}

export type ViewTypeExtraPropsMap = {
  subscription: ViewTypeExtraProps
}
