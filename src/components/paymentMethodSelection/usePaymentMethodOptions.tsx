import React, { useMemo } from 'react'

import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem, PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodLabelNode } from './PaymentMethodLabelNode'

import { formatPaymentMethodLabel } from '../paymentMethodSelection/utils'

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
  const formatted = formatPaymentMethodLabel(translate, paymentMethod)

  return {
    value: paymentMethod.id,
    label: formatted.label,
    type: PaymentMethodTypeEnum.Provider,
    labelNode: (
      <PaymentMethodLabelNode headerText={formatted.headerText} footerText={formatted.footerText} />
    ),
    ...(paymentMethod.isDefault && { isDefault: true }),
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
