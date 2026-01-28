import { useMemo } from 'react'

import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem, PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodInfo } from './PaymentMethodInfo'

export interface PaymentMethodOption {
  value: string
  label: string
  labelNode: React.ReactNode
  isDefault?: boolean
  type: PaymentMethodTypeEnum
}

const mapPaymentMethodItemToOption = (
  paymentMethod: PaymentMethodItem,
  translate: TranslateFunc,
): PaymentMethodOption => {
  const { id, details, isDefault, paymentProviderType } = paymentMethod
  const { type, brand, last4 } = details || {}

  const baseLabel = formatPaymentMethodDetails({ type, brand, last4 })
  const label = isDefault
    ? `${baseLabel} (${translate('text_65281f686a80b400c8e2f6d1')})`
    : baseLabel

  return {
    value: id,
    label,
    type: PaymentMethodTypeEnum.Provider,
    labelNode: (
      <PaymentMethodInfo
        id={id}
        details={details}
        isDefault={isDefault}
        paymentProviderType={paymentProviderType}
        showExpiration={false}
        showProviderAvatar={false}
      />
    ),
    ...(isDefault && { isDefault: true }),
  }
}

export const usePaymentMethodOptions = (
  paymentMethodsList: PaymentMethodList | undefined,
  translate: TranslateFunc,
): PaymentMethodOption[] => {
  return useMemo(() => {
    if (!paymentMethodsList) return []

    const activePaymentMethods = paymentMethodsList.filter((pm) => !pm.deletedAt)

    return activePaymentMethods.reduce((acc, paymentMethod) => {
      const option = mapPaymentMethodItemToOption(paymentMethod, translate)

      // Insert default at the beginning of the options
      return paymentMethod.isDefault ? [option, ...acc] : [...acc, option]
    }, [] as PaymentMethodOption[])
  }, [paymentMethodsList, translate])
}
