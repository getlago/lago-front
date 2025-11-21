import { capitalizeWords } from './capitalizeWords'

export const OBFUSCATED_LAST4_PREFIX = '••••'

/**
 * Formats payment method details into a readable string.
 * Format: "Type - Brand •••• Last4" (all parts are optional)
 *
 * @param details - Payment method details object
 * @param details.type - Payment method type (e.g., "card")
 * @param details.brand - Payment method brand (e.g., "visa", "american_express")
 * @param details.last4 - Last 4 digits of the payment method
 * @returns Formatted string (e.g., "Card - Visa •••• 4242")
 */
export const formatPaymentMethodDetails = (
  details?: {
    type?: string | null
    brand?: string | null
    last4?: string | null
  } | null,
): string => {
  if (!details) return ''

  const parts: string[] = []

  // Add type if present
  if (details.type) {
    const normalizedType = details.type.replace(/_/g, ' ')

    parts.push(capitalizeWords(normalizedType))
  }

  // Add dash separator only if both type and brand are present
  if (details.type && details.brand) {
    parts.push(' - ')
  }

  // Add brand if present
  if (details.brand) {
    const normalizedBrand = details.brand.replace(/_/g, ' ')

    parts.push(capitalizeWords(normalizedBrand))
  }

  // Add last4 if present
  if (details.last4) {
    const prefix = parts.length > 0 ? ' ' : ''

    parts.push(`${prefix}${OBFUSCATED_LAST4_PREFIX} ${details.last4}`)
  }

  return parts.join('')
}
