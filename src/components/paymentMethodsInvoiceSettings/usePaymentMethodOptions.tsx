import React, { useMemo } from 'react'

import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodLabelNode } from './PaymentMethodLabelNode'
import { formatPaymentMethodLabel } from './utils'

export interface PaymentMethodOption {
  value: string
  label: string
  labelNode: React.ReactNode
}

export const usePaymentMethodOptions = (
  paymentMethodsList: PaymentMethodList | undefined,
  translate: TranslateFunc,
): PaymentMethodOption[] => {
  return useMemo(() => {
    const manualOption: PaymentMethodOption = {
      value: 'manual',
      label: translate('text_173799550683709p2rqkoqd5'),
      labelNode: (
        <PaymentMethodLabelNode
          headerText={translate('text_173799550683709p2rqkoqd5')}
          footerText={translate('text_1762878214963uszdnhestt1')}
        />
      ),
    }

    if (!paymentMethodsList) return [manualOption]

    const activePaymentMethods = paymentMethodsList.filter((pm) => !pm.deletedAt)

    const defaultPaymentMethod = activePaymentMethods.find((pm) => pm.isDefault)
    const otherPaymentMethods = activePaymentMethods.filter((pm) => !pm.isDefault)

    const orderedPaymentMethods: PaymentMethodOption[] = [
      ...(defaultPaymentMethod
        ? (() => {
            const formatted = formatPaymentMethodLabel(translate, defaultPaymentMethod)

            return [
              {
                value: defaultPaymentMethod.id,
                label: formatted.label,
                labelNode: (
                  <PaymentMethodLabelNode
                    headerText={formatted.headerText}
                    footerText={formatted.footerText}
                  />
                ),
              },
            ]
          })()
        : []),
      ...otherPaymentMethods.map((paymentMethod) => {
        const formatted = formatPaymentMethodLabel(translate, paymentMethod)

        return {
          value: paymentMethod.id,
          label: formatted.label,
          labelNode: (
            <PaymentMethodLabelNode
              headerText={formatted.headerText}
              footerText={formatted.footerText}
            />
          ),
        }
      }),
    ]

    return [...orderedPaymentMethods, manualOption]
  }, [paymentMethodsList, translate])
}
