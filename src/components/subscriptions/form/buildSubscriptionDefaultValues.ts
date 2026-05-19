import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { SubscriptionFormValues } from '~/formValidation/subscriptionFormSchema'
import { BillingTimeEnum, GetSubscriptionForCreateSubscriptionQuery } from '~/generated/graphql'

export type SubscriptionDefaultsSource = GetSubscriptionForCreateSubscriptionQuery['subscription']

export type SubscriptionFormType = keyof typeof FORM_TYPE_ENUM

export const buildSubscriptionDefaultValues = (
  subscription: SubscriptionDefaultsSource,
  formType: SubscriptionFormType,
  currentDate: string,
): SubscriptionFormValues => ({
  planId: formType !== FORM_TYPE_ENUM.upgradeDowngrade ? subscription?.plan?.id || '' : '',
  name: formType !== FORM_TYPE_ENUM.upgradeDowngrade ? subscription?.name || '' : '',
  externalId: subscription?.externalId || '',
  subscriptionAt: subscription?.subscriptionAt || currentDate,
  endingAt: subscription?.endingAt || undefined,
  billingTime: subscription?.billingTime || BillingTimeEnum.Calendar,
  paymentMethod: {
    paymentMethodType: subscription?.paymentMethodType,
    paymentMethodId: subscription?.paymentMethod?.id,
  },
  invoiceCustomSection: {
    invoiceCustomSections: subscription?.selectedInvoiceCustomSections || [],
    skipInvoiceCustomSections: subscription?.skipInvoiceCustomSections || false,
  },
})
