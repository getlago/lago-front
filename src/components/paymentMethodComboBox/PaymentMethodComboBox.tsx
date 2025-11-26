import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { PaymentMethodComboBoxProps } from './types'
import { usePaymentMethodOptions } from './usePaymentMethodOptions'

import { Typography } from '../designSystem'

export const PaymentMethodComboBox = ({
  externalCustomerId,
  title,
  description,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: PaymentMethodComboBoxProps) => {
  const { translate } = useInternationalization()

  const {
    data: paymentMethodsList,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
  })

  const paymentMethodOptions = usePaymentMethodOptions(paymentMethodsList, translate)

  const comboboxValue = useMemo(() => {
    if (selectedPaymentMethod?.paymentMethodId) {
      return selectedPaymentMethod.paymentMethodId
    }

    if (selectedPaymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
      return 'manual'
    }

    return ''
  }, [selectedPaymentMethod])

  const onChange = (value: string) => {
    const selectedPaymentMethodOption = paymentMethodOptions.find(
      (option) => option.value === value,
    )

    setSelectedPaymentMethod({
      paymentMethodId: selectedPaymentMethodOption?.value || undefined,
      paymentMethodType: selectedPaymentMethodOption?.type || undefined,
    })
  }

  const disabled = externalDisabled || paymentMethodsLoading || !!paymentMethodsError

  return (
    <div>
      {title && (
        <Typography variant="captionHl" color="textSecondary">
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="caption" className="mb-3">
          {description}
        </Typography>
      )}

      <ComboBox
        className={className}
        name={name}
        data={paymentMethodOptions}
        placeholder={translate('text_1762173848714al2j36a59ce')}
        emptyText={translate('text_1762173891817jhfenej7eho')}
        value={comboboxValue}
        onChange={onChange}
        loading={paymentMethodsLoading}
        disabled={disabled}
        sortValues={false}
      />
    </div>
  )
}
