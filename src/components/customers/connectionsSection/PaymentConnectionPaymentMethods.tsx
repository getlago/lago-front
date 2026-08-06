import { useMemo } from 'react'

import {
  ADD_PAYMENT_METHOD_TEST_ID,
  INELIGIBLE_PAYMENT_METHODS_TEST_ID,
  PAYMENT_METHODS_LIST_TEST_ID,
} from '~/components/customers/connectionsSection/constants'
import { getProviderPaymentConnection } from '~/components/customers/connectionsSection/utils'
import { LinkedPaymentProvider } from '~/components/customers/types'
import { useAddPaymentMethodDialog } from '~/components/customers/useAddPaymentMethodDialog'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { PaymentMethodsList } from '~/components/paymentMethodsList/PaymentMethodList'
import { CustomerDetailsFragment, ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const INELIGIBLE_PAYMENT_METHODS: ProviderPaymentMethodsEnum[] = [
  ProviderPaymentMethodsEnum.CustomerBalance,
  ProviderPaymentMethodsEnum.Crypto,
]

type PaymentConnectionPaymentMethodsProps = {
  customer: CustomerDetailsFragment
  linkedPaymentProvider: LinkedPaymentProvider
}

/**
 * The payment-methods block of the connections master-detail, scoped to the
 * selected payment connection: the add-method dialog opens with the
 * connection's provider preselected and locked.
 */
export const PaymentConnectionPaymentMethods = ({
  customer,
  linkedPaymentProvider,
}: PaymentConnectionPaymentMethodsProps) => {
  const { translate } = useInternationalization()
  const { openAddPaymentMethodDialog } = useAddPaymentMethodDialog()

  // Bank Transfer / Crypto only: the provider can't register a new method
  const hasOnlyIneligiblePaymentMethods = useMemo(() => {
    const methods = getProviderPaymentConnection(customer)?.providerPaymentMethods

    if (!methods?.length) return false

    return methods.every((method) => INELIGIBLE_PAYMENT_METHODS.includes(method))
  }, [customer])

  return (
    <>
      <PageSectionTitle
        className="mb-4"
        title={translate('text_64aeb7b998c4322918c84204')}
        subtitle={translate('text_1785242578759leeeogzr3we')}
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
