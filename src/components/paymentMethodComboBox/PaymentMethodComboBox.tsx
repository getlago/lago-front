import { FormikProps } from 'formik'
import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

import { usePaymentMethodOptions } from './usePaymentMethodOptions'

interface PaymentMethodComboBoxProps {
  externalCustomerId: string
  value?: string
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
  formikProps: FormikProps<SubscriptionFormInput>
}

export const PaymentMethodComboBox = ({
  externalCustomerId,
  label,
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  formikProps,
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
    const paymentMethod = formikProps.values.paymentMethod

    if (paymentMethod?.paymentMethodId) {
      return paymentMethod.paymentMethodId
    }

    if (paymentMethod?.paymentMethodType === PaymentMethodTypeEnum.Manual) {
      return 'manual'
    }

    return ''
  }, [formikProps.values.paymentMethod])

  const onChange = (value: string) => {
    const selectedPaymentMethod = paymentMethodOptions.find((option) => option.value === value)

    formikProps.setFieldValue('paymentMethod', {
      paymentMethodId: selectedPaymentMethod?.value || undefined,
      paymentMethodType: selectedPaymentMethod?.type || undefined,
    })
  }

  const disabled = externalDisabled || paymentMethodsLoading || !!paymentMethodsError

  return (
    <ComboBox
      className={className}
      name={name}
      data={paymentMethodOptions}
      label={label}
      placeholder={placeholder}
      emptyText={emptyText}
      value={comboboxValue}
      onChange={onChange}
      loading={paymentMethodsLoading}
      disabled={disabled}
      sortValues={false}
    />
  )
}
