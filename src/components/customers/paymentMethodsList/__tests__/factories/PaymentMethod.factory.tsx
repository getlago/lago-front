import { PaymentMethodItem } from '~/components/customers/paymentMethodsList/types'
import { ProviderTypeEnum } from '~/generated/graphql'

export const createMockPaymentMethod = (
  overrides: Partial<PaymentMethodItem> = {},
): PaymentMethodItem => {
  return {
    __typename: 'PaymentMethod',
    id: 'pm_001',
    isDefault: false,
    paymentProviderCode: 'stripe',
    paymentProviderCustomerId: 'cus_001',
    paymentProviderType: ProviderTypeEnum.Stripe,
    details: {
      __typename: 'PaymentMethodDetails',
      brand: 'visa',
      expirationYear: '2025',
      expirationMonth: '12',
      last4: '4242',
      type: 'card',
    },
    ...overrides,
  } as PaymentMethodItem
}
