import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

const buildFooterParts = (
  paymentProviderType?: string | null,
  paymentProviderCode?: string | null,
): string[] => {
  const parts: string[] = []

  if (paymentProviderType) {
    parts.push(paymentProviderType)
  }

  if (paymentProviderType && paymentProviderCode) {
    parts.push(' • ')
  }

  if (paymentProviderCode) {
    parts.push(paymentProviderCode)
  }

  return parts
}

export const formatPaymentMethodLabel = (
  translate: TranslateFunc,
  paymentMethod: PaymentMethodItem,
): { label: string; headerText: string; footerText: string; isDefault: boolean } => {
  const { details, isDefault, paymentProviderType, paymentProviderCode } = paymentMethod
  const { brand, type } = details || {}

  const baseLabel = formatPaymentMethodDetails({ type, brand })
  const footerParts = buildFooterParts(paymentProviderType, paymentProviderCode)
  const footerLabel = footerParts.join('')

  const labelText = isDefault
    ? `${baseLabel} (${translate('text_65281f686a80b400c8e2f6d1')})`
    : baseLabel

  return {
    label: labelText,
    headerText: labelText,
    footerText: footerLabel,
    isDefault,
  }
}
