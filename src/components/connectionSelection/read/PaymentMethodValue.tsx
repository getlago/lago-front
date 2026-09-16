import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { useResolvedPaymentMethodDisplay } from '~/components/paymentMethodSelection/useResolvedPaymentMethodDisplay'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

export const PAYMENT_METHOD_VALUE_CHIP_TEST_ID = 'payment-method-value-chip'
export const PAYMENT_METHOD_VALUE_INHERITED_TEST_ID = 'payment-method-value-inherited'

type PaymentMethodValueProps = {
  selectedPaymentMethod?: SelectedPaymentMethod
  externalCustomerId?: string
}

export const PaymentMethodValue = ({
  selectedPaymentMethod,
  externalCustomerId,
}: PaymentMethodValueProps): JSX.Element => {
  const { translate } = useInternationalization()

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
    withDeleted: false,
  })

  const { isInherited, label } = useResolvedPaymentMethodDisplay(
    selectedPaymentMethod,
    paymentMethodsList,
  )

  return (
    <span className="flex items-center gap-2">
      <Chip data-test={PAYMENT_METHOD_VALUE_CHIP_TEST_ID} label={label} />

      {isInherited && (
        <Typography
          data-test={PAYMENT_METHOD_VALUE_INHERITED_TEST_ID}
          variant="body"
          color="grey600"
          component="span"
        >
          {`(${translate('text_1789558944658bay5bstkcut')})`}
        </Typography>
      )}
    </span>
  )
}
