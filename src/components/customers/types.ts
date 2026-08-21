import { PaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery } from '~/generated/graphql'

export type LinkedPaymentProvider =
  | NonNullable<
      PaymentProvidersListForCustomerCreateEditExternalAppsAccordionQuery['paymentProviders']
    >['collection'][number]
  | undefined
