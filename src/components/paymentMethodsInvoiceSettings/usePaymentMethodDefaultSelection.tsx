import { useEffect, useRef, useState } from 'react'

import { PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodOption } from './usePaymentMethodOptions'

export const usePaymentMethodDefaultSelection = (
  paymentMethodOptions: PaymentMethodOption[],
  paymentMethodsList: PaymentMethodList | undefined,
): [string, (value: string) => void] => {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const hasInitializedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!hasInitializedRef.current && paymentMethodOptions.length > 0) {
      const defaultPaymentMethod = paymentMethodsList?.find((pm) => pm.isDefault && !pm.deletedAt)

      if (defaultPaymentMethod) {
        setSelectedPaymentMethodId(defaultPaymentMethod.id)
      } else {
        setSelectedPaymentMethodId(paymentMethodOptions[0].value)
      }

      hasInitializedRef.current = true
    }
  }, [paymentMethodOptions, paymentMethodsList])

  return [selectedPaymentMethodId, setSelectedPaymentMethodId]
}
