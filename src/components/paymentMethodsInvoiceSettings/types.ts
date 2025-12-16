import { FormikProps } from 'formik'

import { Customer, Maybe } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
import { TWalletDataForm } from '~/pages/wallet/types'

export enum ViewTypeEnum {
  Subscription = 'subscription',
  WalletTopUp = 'walletTopUp',
  WalletRecurringTopUp = 'walletRecurringTopUp',
}

export type ViewType = ViewTypeEnum

type FormTypeMap = {
  [ViewTypeEnum.Subscription]: SubscriptionFormInput
  [ViewTypeEnum.WalletTopUp]: TWalletDataForm
  [ViewTypeEnum.WalletRecurringTopUp]: TWalletDataForm
}

type CustomerForPaymentMethods = Maybe<Partial<Pick<Customer, 'id' | 'externalId'>>>

export interface PaymentMethodsInvoiceSettingsProps<T extends ViewType = ViewType> {
  customer: CustomerForPaymentMethods
  formikProps: FormikProps<FormTypeMap[T]>
  viewType: T
  basePath?: string
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
  [K in ViewType]: ViewTypeExtraProps
}
