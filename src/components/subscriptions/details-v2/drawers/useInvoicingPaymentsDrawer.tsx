import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { InvoicingPaymentsFormSection } from '~/components/subscriptions/form/InvoicingPaymentsFormSection'
import { InvoicingPaymentsSectionFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionInvoicingPayments } from '~/hooks/customer/useUpdateSubscriptionInvoicingPayments'

const INVOICING_PAYMENTS_FORM_ID = 'invoicing-payments-drawer-form'

export const useInvoicingPaymentsDrawer = (subscription: InvoicingPaymentsSectionFragment) => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const { form, resetForm } = useUpdateSubscriptionInvoicingPayments({
    subscription,
    onSuccess() {
      drawer.close()
    },
  })

  const openDrawer = () => {
    resetForm()

    const submitForm = () => {
      form.handleSubmit()
    }

    drawer.open({
      title: translate('text_1780503765268ttscgcx6yo7'),
      form: { id: INVOICING_PAYMENTS_FORM_ID, submit: submitForm },
      mainAction: (
        <form.Subscribe selector={({ canSubmit }) => canSubmit}>
          {(canSubmit) => (
            <Button
              data-test="invoicing-payments-drawer-save"
              onClick={submitForm}
              disabled={!canSubmit}
            >
              {translate('text_17295436903260tlyb1gp1i7')}
            </Button>
          )}
        </form.Subscribe>
      ),
      children: (
        <InvoicingPaymentsFormSection
          form={form}
          customer={{
            id: subscription.customer?.id,
            externalId: subscription.customer?.externalId,
          }}
        />
      ),
    })
  }

  return { openDrawer }
}
