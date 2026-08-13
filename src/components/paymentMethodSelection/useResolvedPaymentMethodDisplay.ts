import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { SelectedPaymentMethod } from './types'
import { useDisplayedPaymentMethod } from './useDisplayedPaymentMethod'

export interface ResolvedPaymentMethodDisplay {
  isManual: boolean
  isInherited: boolean
  /** Manual label or formatted card details — empty when nothing resolved */
  label: string
  /** " (inherited)" when the method falls back to the customer default, else "" */
  inheritedSuffix: string
  /** Concatenated grid value: label + suffix, or "-" when nothing resolved */
  value: string
}

/**
 * Resolves a selected payment method to its display parts, exactly like the
 * subscription overview (PaymentInvoiceDetails): the `paymentMethodId` lets a
 * specific provider card resolve from the customer's list (isInherited=false),
 * so the inherited badge only shows for an actual customer-default fallback.
 *
 * Consumers rendering the parts separately (badges, data-test spans) use the
 * structured fields; grid consumers use `value` (or the
 * `useResolvedPaymentMethodValue` shortcut below).
 */
export const useResolvedPaymentMethodDisplay = (
  selectedPaymentMethod: SelectedPaymentMethod,
  paymentMethodsList?: PaymentMethodList,
): ResolvedPaymentMethodDisplay => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const displayedPaymentMethod = useDisplayedPaymentMethod(
    selectedPaymentMethod,
    paymentMethodsList,
  )

  const inheritedSuffix = displayedPaymentMethod.isInherited
    ? ` (${translate('text_1764327933607jgtpungo2pp')})`
    : ''

  let label = ''

  if (displayedPaymentMethod.isManual) {
    label = translate('text_173799550683709p2rqkoqd5')
  } else if (displayedPaymentMethod.paymentMethod) {
    const { details, createdAt } = displayedPaymentMethod.paymentMethod

    label =
      formatPaymentMethodDetails(details) ||
      translate('text_1771854080250kv3j6oa9nxj', {
        date: intlFormatDateTimeOrgaTZ(createdAt).date,
      })
  }

  return {
    isManual: displayedPaymentMethod.isManual,
    isInherited: displayedPaymentMethod.isInherited,
    label,
    inheritedSuffix,
    value: label ? `${label}${inheritedSuffix}` : '-',
  }
}

/**
 * String shortcut for detail grids (e.g. wallet overview InfoGrid rows).
 */
export const useResolvedPaymentMethodValue = (
  selectedPaymentMethod: SelectedPaymentMethod,
  paymentMethodsList?: PaymentMethodList,
): string => useResolvedPaymentMethodDisplay(selectedPaymentMethod, paymentMethodsList).value
