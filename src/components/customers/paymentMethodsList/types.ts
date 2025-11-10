import { PaymentMethodsQuery } from '~/generated/graphql'

export type PaymentMethodItem = PaymentMethodsQuery['paymentMethods']['collection'][number]
