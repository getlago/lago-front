import { FormikProps } from 'formik'

import { Customer, Maybe } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
import { TWalletDataForm } from '~/pages/wallet/types'

export enum ViewTypeEnum {
  Subscription = 'subscription',
  WalletTopUp = 'walletTopUp',
  WalletRecurringTopUp = 'walletRecurringTopUp',
}

export const VIEW_TYPE_TRANSLATION_KEYS: Record<ViewTypeEnum, string> = {
  [ViewTypeEnum.Subscription]: 'text_1764327933607nrezuuiheuc',
  [ViewTypeEnum.WalletTopUp]: 'text_1765895170354ovelm7g07o4',
  [ViewTypeEnum.WalletRecurringTopUp]: 'text_1765959116589recur1ngrul',
}

type FormTypeMap = {
  [ViewTypeEnum.Subscription]: SubscriptionFormInput
  [ViewTypeEnum.WalletTopUp]: TWalletDataForm
  [ViewTypeEnum.WalletRecurringTopUp]: TWalletDataForm
}

type CustomerForPaymentMethods = Maybe<Partial<Pick<Customer, 'id' | 'externalId'>>>

export interface PaymentMethodsInvoiceSettingsProps<T extends ViewTypeEnum = ViewTypeEnum> {
  customer: CustomerForPaymentMethods
  formikProps: FormikProps<FormTypeMap[T]>
  viewType: T
  formFieldBasePath?: string
}
