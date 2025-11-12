import { useEffect, useRef, useState } from 'react'

import { PaymentMethodOption } from './usePaymentMethodOptions'

export const usePaymentMethodDefaultSelection = (
  paymentMethodOptions: PaymentMethodOption[],
): [string, (value: string) => void] => {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const hasInitializedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!hasInitializedRef.current && paymentMethodOptions.length > 0) {
      const defaultPaymentMethod = paymentMethodOptions.find((option) => option.isDefault)

      if (defaultPaymentMethod) {
        setSelectedPaymentMethodId(defaultPaymentMethod.value)
      } else {
        setSelectedPaymentMethodId(paymentMethodOptions[0].value)
      }

      hasInitializedRef.current = true
    }
  }, [paymentMethodOptions])

  return [selectedPaymentMethodId, setSelectedPaymentMethodId]
}
