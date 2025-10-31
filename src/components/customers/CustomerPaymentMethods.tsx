import { useRef } from 'react'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { PageSectionTitle } from '~/components/layouts/Section'
import { CustomerMainInfosFragment, ProviderPaymentMethodsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const ADD_PAYMENT_METHOD_TEST_ID = 'add-payment-method-dialog'
export const ELIGIBLE_PAYMENT_METHODS_TEST_ID = 'eligible-payment-methods-text'
export const INELIGIBLE_PAYMENT_METHODS_TEST_ID = 'ineligible-payment-methods-text'

export const CustomerPaymentMethods = ({ customer }: { customer: CustomerMainInfosFragment }) => {
  const { translate } = useInternationalization()
  const addPaymentDialogRef = useRef<DialogRef>(null)

  const customerAvailablePaymentMethods = customer?.providerCustomer?.providerPaymentMethods || []
  const ineligiblePaymentMethods = [
    ProviderPaymentMethodsEnum.CustomerBalance,
    ProviderPaymentMethodsEnum.Crypto,
  ]

  const isCustomerEligibleForAddingPaymentMethods = customerAvailablePaymentMethods.some(
    (method) => !ineligiblePaymentMethods.includes(method),
  )

  return (
    <>
      <PageSectionTitle
        className="mb-4"
        title={translate('text_64aeb7b998c4322918c84204')}
        subtitle={translate('text_17619148029867qcebvr5eui')}
        action={{
          title: translate('text_1761914802986ww4ima0w9w9'),
          onClick: () => addPaymentDialogRef.current?.openDialog(),
          isDisabled: !isCustomerEligibleForAddingPaymentMethods,
          dataTest: ADD_PAYMENT_METHOD_TEST_ID,
        }}
      />

      {!isCustomerEligibleForAddingPaymentMethods && (
        <Typography color="grey500" className="mb-4" data-test={INELIGIBLE_PAYMENT_METHODS_TEST_ID}>
          {translate('text_17619148029863fx3w8kwfdp')}
        </Typography>
      )}

      {isCustomerEligibleForAddingPaymentMethods && (
        <div data-test={ELIGIBLE_PAYMENT_METHODS_TEST_ID}>
          <Typography color="grey500">{translate('text_1761915128154gyls7eboz4s')}</Typography>

          <Dialog
            ref={addPaymentDialogRef}
            title={translate('text_1761914802986ww4ima0w9w9')}
            description={translate('text_1761914802986ipq0aot8fas')}
            actions={({ closeDialog }) => (
              <>
                <Button variant="quaternary" onClick={() => closeDialog()}>
                  {translate('text_63e51ef4985f0ebd75c21313')}
                </Button>
                <Button onClick={() => {} /* TODO implement generate link*/}>
                  {translate('text_1761914802986cu9mjc19csx')}
                </Button>
              </>
            )}
          >
            <Typography className="mb-4">--- Select Payment Method ---</Typography>
          </Dialog>
        </div>
      )}
    </>
  )
}
