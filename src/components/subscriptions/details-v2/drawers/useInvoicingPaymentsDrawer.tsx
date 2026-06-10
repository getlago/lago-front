import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
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

    drawer.open({
      title: translate('text_1780503765268ttscgcx6yo7'),
      form: { id: INVOICING_PAYMENTS_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="invoicing-payments-drawer-save">
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
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
