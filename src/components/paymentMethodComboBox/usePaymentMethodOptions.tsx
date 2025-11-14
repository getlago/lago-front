import React, { useMemo } from 'react'

import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem, PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodLabelNode } from './PaymentMethodLabelNode'
import { formatPaymentMethodLabel } from './utils'

export enum PaymentMethodTypeEnum {
  Provider = 'provider',
  Manual = 'manual',
}
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
    const manualOption: PaymentMethodOption = {
      value: 'manual',
      label: translate('text_173799550683709p2rqkoqd5'),
      type: PaymentMethodTypeEnum.Manual,
      labelNode: (
        <PaymentMethodLabelNode
          headerText={translate('text_173799550683709p2rqkoqd5')}
          footerText={translate('text_1762878214963uszdnhestt1')}
        />
      ),
    }

    if (!paymentMethodsList) return [manualOption]

    const activePaymentMethods = paymentMethodsList.filter((pm) => !pm.deletedAt)

    const orderedPaymentMethods: PaymentMethodOption[] = activePaymentMethods.reduce(
      (acc, paymentMethod) => {
        const option = mapPaymentMethodItemToOption(paymentMethod, translate)

        // Insert default at the beginning of the options
        return paymentMethod.isDefault ? [option, ...acc] : [...acc, option]
      },
      [] as PaymentMethodOption[],
    )

    return [...orderedPaymentMethods, manualOption]
  }, [paymentMethodsList, translate])
}
