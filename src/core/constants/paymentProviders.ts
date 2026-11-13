import { ProviderTypeEnum } from '~/generated/graphql'

// `Invoices::Payments::GeneratePaymentUrlService` rejects these with `invalid_payment_provider`.
export const PROVIDERS_WITHOUT_PAYMENT_URL: ReadonlySet<ProviderTypeEnum> = new Set([
  ProviderTypeEnum.Gocardless,
])
