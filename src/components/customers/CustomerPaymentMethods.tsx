import { useMemo } from 'react'

import { LinkedPaymentProvider } from '~/components/customers/types'
import { useAddPaymentMethodDialog } from '~/components/customers/useAddPaymentMethodDialog'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PaymentMethodsList } from '~/components/paymentMethodsList/PaymentMethodList'
import { CustomerMainInfosFragment, ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const ADD_PAYMENT_METHOD_TEST_ID = 'add-payment-method-dialog'
export const INELIGIBLE_PAYMENT_METHODS_TEST_ID = 'ineligible-payment-methods-text'
export const PAYMENT_METHODS_LIST_TEST_ID = 'payment-methods-list'

const INELIGIBLE_PAYMENT_METHODS: ProviderPaymentMethodsEnum[] = [
  ProviderPaymentMethodsEnum.CustomerBalance,
  ProviderPaymentMethodsEnum.Crypto,
]

interface Props {
  customer: CustomerMainInfosFragment
  linkedPaymentProvider: LinkedPaymentProvider
}

export const CustomerPaymentMethods = ({ customer, linkedPaymentProvider }: Props) => {
  const { translate } = useInternationalization()
  const { openAddPaymentMethodDialog } = useAddPaymentMethodDialog()

  const hasOnlyIneligiblePaymentMethods = useMemo(() => {
    const linkedProviderCustomer = customer.providerCustomer
    const availableProviderPaymentMethods = linkedProviderCustomer?.providerPaymentMethods

    if (!linkedProviderCustomer || !availableProviderPaymentMethods) return false

    const canAddPaymentMethods = availableProviderPaymentMethods.some(
      (method) => !INELIGIBLE_PAYMENT_METHODS.includes(method),
    )

    return (
      !!linkedProviderCustomer &&
      availableProviderPaymentMethods.length > 0 &&
      !canAddPaymentMethods
    )
  }, [customer.providerCustomer])

  return (
    <>
      <PageSectionTitle
        className="mb-4"
        title={translate('text_64aeb7b998c4322918c84204')}
        subtitle={translate('text_17619148029867qcebvr5eui')}
        action={{
          title: translate('text_1761914802986ww4ima0w9w9'),
          onClick: () =>
            openAddPaymentMethodDialog({
              customerId: customer.id,
              linkedPaymentProvider,
            }),
          isDisabled: hasOnlyIneligiblePaymentMethods,
          dataTest: ADD_PAYMENT_METHOD_TEST_ID,
        }}
      />

      {hasOnlyIneligiblePaymentMethods && (
        <Typography color="grey500" className="mb-4" data-test={INELIGIBLE_PAYMENT_METHODS_TEST_ID}>
          {translate('text_17619148029863fx3w8kwfdp')}
        </Typography>
      )}

      {!hasOnlyIneligiblePaymentMethods && (
        <div data-test={PAYMENT_METHODS_LIST_TEST_ID}>
          <PaymentMethodsList externalCustomerId={customer.externalId} />
        </div>
      )}
    </>
  )
}
