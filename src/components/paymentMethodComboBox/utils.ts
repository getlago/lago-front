import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const buildHeaderParts = (type?: string | null, brand?: string | null): string[] => {
  const parts: string[] = []

  if (type) {
    parts.push(type.charAt(0).toUpperCase() + type.slice(1))
  }

  if (type && brand) {
    parts.push(' - ')
  }

  if (brand) {
    const normalizedBrand = brand.replace(/_/g, ' ')

    parts.push(capitalizeWords(normalizedBrand))
  }

  return parts
}

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

  const headerParts = buildHeaderParts(type, brand)
  const footerParts = buildFooterParts(paymentProviderType, paymentProviderCode)

  const baseLabel = headerParts.join('')
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
