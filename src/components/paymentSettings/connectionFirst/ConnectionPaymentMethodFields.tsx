import { useEffect, useState } from 'react'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { Radio } from '~/components/form/Radio/Radio'
import { PaymentMethodComboBox } from '~/components/paymentMethodSelection/PaymentMethodComboBox'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { VIEW_TYPE_TRANSLATION_KEYS, ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem, PaymentMethodList } from '~/hooks/customer/usePaymentMethodsList'

export const CONNECTION_METHOD_DEFAULT_RADIO_TEST_ID = 'connection-payment-method-default-radio'
export const CONNECTION_METHOD_SPECIFIC_RADIO_TEST_ID = 'connection-payment-method-specific-radio'
export const CONNECTION_METHOD_NO_DEFAULT_CHIP_TEST_ID = 'connection-payment-method-no-default-chip'
export const CONNECTION_METHOD_DEFAULT_CHIP_TEST_ID = 'connection-payment-method-default-chip'

enum MethodBehavior {
  DEFAULT = 'default',
  SPECIFIC = 'specific',
}

const toValue = (behavior: MethodBehavior, paymentMethodId: string): SelectedPaymentMethod => ({
  paymentMethodId: behavior === MethodBehavior.SPECIFIC ? paymentMethodId || undefined : null,
  paymentMethodType: PaymentMethodTypeEnum.Provider,
})

interface ConnectionPaymentMethodFieldsProps {
  viewType: ViewTypeEnum
  paymentMethodsList: PaymentMethodList
  loading?: boolean
  defaultPaymentMethod?: PaymentMethodItem
  value?: SelectedPaymentMethod
  onChange: (value: SelectedPaymentMethod) => void
  error?: string
}

/** The payment method is a sub-choice of the resolved connection, so it carries no manual branch. */
export const ConnectionPaymentMethodFields = ({
  viewType,
  paymentMethodsList,
  loading = false,
  defaultPaymentMethod,
  value,
  onChange,
  error,
}: ConnectionPaymentMethodFieldsProps) => {
  const { translate } = useInternationalization()

  const [behavior, setBehavior] = useState<MethodBehavior>(() =>
    value?.paymentMethodId ? MethodBehavior.SPECIFIC : MethodBehavior.DEFAULT,
  )
  const [paymentMethodId, setPaymentMethodId] = useState<string>(() => value?.paymentMethodId || '')

  // A reset from the parent publishes `null`, while picking the specific branch before choosing an
  // id publishes `undefined`. Only the first pulls the control back to the default branch.
  useEffect(() => {
    if (value?.paymentMethodId !== null) return

    setBehavior(MethodBehavior.DEFAULT)
    setPaymentMethodId('')
  }, [value?.paymentMethodId])

  const handleBehaviorChange = (next: MethodBehavior): void => {
    setBehavior(next)
    onChange(toValue(next, paymentMethodId))
  }

  const handleComboboxChange = (selected: SelectedPaymentMethod): void => {
    const nextId = selected?.paymentMethodId || ''

    setPaymentMethodId(nextId)
    onChange(toValue(MethodBehavior.SPECIFIC, nextId))
  }

  const renderDefaultMethodChip = () => {
    if (loading) return null

    if (!defaultPaymentMethod) {
      return (
        <Chip
          color="grey600"
          label={translate('text_1789374590510zcsc35s62mc')}
          data-test={CONNECTION_METHOD_NO_DEFAULT_CHIP_TEST_ID}
        />
      )
    }

    const { details } = defaultPaymentMethod
    const expiration =
      details?.expirationMonth && details?.expirationYear
        ? ` • ${translate('text_1762437511802zhw5mx0iamd')} ${details.expirationMonth}/${details.expirationYear.slice(-2)}`
        : ''

    return (
      <Chip
        label={`${formatPaymentMethodDetails(details)}${expiration}`}
        data-test={CONNECTION_METHOD_DEFAULT_CHIP_TEST_ID}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Typography variant="subhead1" color="grey700">
          {translate('text_17440371192353kif37ol194')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_1789380062855ssr59hpitzd', {
            object: translate(VIEW_TYPE_TRANSLATION_KEYS[viewType]),
          })}
        </Typography>
      </div>

      <div className="flex flex-col gap-2" data-test={CONNECTION_METHOD_DEFAULT_RADIO_TEST_ID}>
        <Radio
          name="connectionPaymentMethodBehavior"
          value={MethodBehavior.DEFAULT}
          checked={behavior === MethodBehavior.DEFAULT}
          onChange={(next) => handleBehaviorChange(next as MethodBehavior)}
          label={translate('text_1789374590507j8hnidtlhwy')}
          labelVariant="body"
        />
        <div className="ml-9">{renderDefaultMethodChip()}</div>
      </div>

      <div data-test={CONNECTION_METHOD_SPECIFIC_RADIO_TEST_ID}>
        <Radio
          name="connectionPaymentMethodBehavior"
          value={MethodBehavior.SPECIFIC}
          checked={behavior === MethodBehavior.SPECIFIC}
          onChange={(next) => handleBehaviorChange(next as MethodBehavior)}
          label={translate('text_1782801373795gxafl6ekcte')}
          labelVariant="body"
        />
        {behavior === MethodBehavior.SPECIFIC && (
          <div className="ml-9 mt-4">
            <PaymentMethodComboBox
              paymentMethodsList={paymentMethodsList}
              selectedPaymentMethod={{
                paymentMethodId: paymentMethodId || undefined,
                paymentMethodType: PaymentMethodTypeEnum.Provider,
              }}
              setSelectedPaymentMethod={handleComboboxChange}
              error={error}
              PopperProps={{ displayInDialog: true }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
