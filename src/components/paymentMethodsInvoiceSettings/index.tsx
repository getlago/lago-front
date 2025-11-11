import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Card, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { PaymentMethodItem, usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
}

const formatPaymentMethodLabel = (
  translate: TranslateFunc,
  paymentMethod: PaymentMethodItem,
): { label: string; labelNode: React.ReactNode } => {
  const { details, isDefault, paymentProviderType, paymentProviderCode } = paymentMethod
  const { brand, type } = details || {}
  const headerParts: string[] = []
  const footerParts: string[] = []

  if (type || brand) {
    if (type) {
      headerParts.push(type.charAt(0).toUpperCase() + type.slice(1))
    }
    if (type && brand) {
      headerParts.push(' - ')
    }
    if (brand) {
      headerParts.push(brand.charAt(0).toUpperCase() + brand.slice(1))
    }
  }

  if (paymentProviderType || paymentProviderCode) {
    if (paymentProviderType) {
      footerParts.push(paymentProviderType)
    }

    if (paymentProviderType && paymentProviderCode) {
      footerParts.push(' • ')
    }

    if (paymentProviderCode) {
      footerParts.push(paymentProviderCode)
    }
  }

  const baseLabel = headerParts.join(' ')
  const footerLabel = footerParts.join(' ')

  const labelText = isDefault
    ? `${baseLabel} (${translate('text_65281f686a80b400c8e2f6d1')})`
    : baseLabel

  const labelNode = (
    <div>
      <Typography variant="body" color="textSecondary">
        {labelText}
      </Typography>

      <Typography variant="caption">{footerLabel}</Typography>
    </div>
  )

  return { label: labelText, labelNode }
}

interface PaymentMethodOption {
  value: string
  label: string
  labelNode: React.ReactNode
}

export const PaymentMethodsInvoiceSettings = ({ customer }: PaymentMethodsInvoiceSettingsProps) => {
  const { translate } = useInternationalization()
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const hasInitializedRef = useRef<boolean>(false)

  const {
    data: paymentMethodsList,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethodsList({
    externalCustomerId: customer?.externalId || '',
  })

  const paymentMethodOptions: PaymentMethodOption[] = useMemo(() => {
    const manualOption = {
      value: 'manual',
      label: translate('text_173799550683709p2rqkoqd5'),
      labelNode: (
        <div>
          <Typography variant="body" color="textSecondary">
            {translate('text_173799550683709p2rqkoqd5')}
          </Typography>

          <Typography variant="caption">
            Record a manual payment to track this transaction outside payment providers.
          </Typography>
        </div>
      ),
    }

    if (!paymentMethodsList) return [manualOption]

    const activePaymentMethods = paymentMethodsList.filter((pm) => !pm.deletedAt)

    const defaultPaymentMethod = activePaymentMethods.find((pm) => pm.isDefault)
    const otherPaymentMethods = activePaymentMethods.filter((pm) => !pm.isDefault)

    const orderedPaymentMethods = [
      ...(defaultPaymentMethod
        ? [
            {
              value: defaultPaymentMethod.id,
              ...formatPaymentMethodLabel(translate, defaultPaymentMethod),
            },
          ]
        : []),
      ...otherPaymentMethods.map((paymentMethod) => ({
        value: paymentMethod.id,
        ...formatPaymentMethodLabel(translate, paymentMethod),
      })),
    ]

    return [...orderedPaymentMethods, manualOption]
  }, [paymentMethodsList, translate])

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

  if (!customer || !customer?.externalId) return null

  return (
    <div className="not-last-child:mb-8">
      <Typography variant="headline">{translate('text_1762862388271au34vz50g8i')}</Typography>
      <Card>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17440371192353kif37ol194')}
          </Typography>
          <Typography variant="caption" className="mb-3">
            {translate('text_1762862363071z59xqjpg844')}
          </Typography>
          <ComboBox
            className="mb-4"
            name="selectPaymentMethod"
            data={paymentMethodOptions}
            label={translate('text_17440371192353kif37ol194')}
            placeholder={translate('text_1762173848714al2j36a59ce')}
            emptyText={translate('text_1762173891817jhfenej7eho')}
            value={selectedPaymentMethodId}
            onChange={(value) => {
              setSelectedPaymentMethodId(value)
            }}
            loading={paymentMethodsLoading}
            disabled={
              paymentMethodsLoading || !!paymentMethodsError || paymentMethodOptions.length === 0
            }
            sortValues={false}
          />
        </div>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17628623882713knw0jtohiw')}
          </Typography>
          <Typography variant="caption" className="mb-4">
            {translate('text_1762862855282gldrtploh46')}
          </Typography>
          <Button
            startIcon="plus"
            variant="inline"
            // eslint-disable-next-line no-console
            onClick={() => console.log(true)}
            data-test="show-name"
          >
            {translate('text_1762862908777d78m2z5d29a')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
