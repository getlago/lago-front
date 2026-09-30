import { AdditionalIntegrationSettingsValues } from '~/components/additionalIntegrationSettings/additionalIntegrationSettingsSchema'
import { SelectedConnection } from '~/components/connectionSelection/types'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { addToast } from '~/core/apolloClient'
import {
  ConnectionBehaviorEnum,
  LagoApiError,
  UpdateSubscriptionInput,
  useUpdateSubscriptionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// Persists the subscription payment / invoicing settings from the edit-page
// drawers. Each saver maps the drawer's committed values to the subset of
// UpdateSubscriptionInput it owns and throws on failure, so the (creation-
// shared) drawer keeps its `await onSave()` open with the draft intact.
export const useUpdateSubscriptionSettings = (subscriptionId: string) => {
  const { translate } = useInternationalization()

  const [updateSubscription] = useUpdateSubscriptionMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateSubscription: updated }) {
      if (updated) {
        addToast({ severity: 'success', message: translate('text_65118a52df984447c186962e') })
      }
    },
  })

  // The mutation suppresses the error toast for UnprocessableEntity (silent), so
  // it can resolve with `data.updateSubscription == null` on a validation
  // failure instead of rejecting. Throw explicitly so the drawer never closes
  // on a failed save, regardless of whether Apollo rejected or resolved.
  const update = async (input: UpdateSubscriptionInput): Promise<void> => {
    const result = await updateSubscription({ variables: { input } })

    if (!result.data?.updateSubscription) {
      throw new Error('Subscription update failed')
    }
  }

  const savePayment = ({
    paymentMethod,
    connection,
  }: {
    paymentMethod: SelectedPaymentMethod
    connection?: SelectedConnection
  }): Promise<void> =>
    update({
      id: subscriptionId,
      ...(connection ? { connections: { payment: connection } } : {}),
      paymentMethod: paymentMethod
        ? {
            paymentMethodId: paymentMethod.paymentMethodId,
            paymentMethodType: paymentMethod.paymentMethodType,
          }
        : undefined,
    })

  const saveInvoicing = ({
    consolidateInvoice,
    invoiceCustomSection,
  }: {
    consolidateInvoice: boolean
    invoiceCustomSection: InvoiceCustomSectionInput
  }): Promise<void> =>
    update({
      id: subscriptionId,
      consolidateInvoice,
      invoiceCustomSection: toInvoiceCustomSectionReference(invoiceCustomSection),
    })

  const saveAdditionalIntegrations = (values: AdditionalIntegrationSettingsValues): Promise<void> =>
    update({
      id: subscriptionId,
      connections: {
        accounting: values.accounting ?? { behavior: ConnectionBehaviorEnum.Inherit },
        crm: values.crm ?? { behavior: ConnectionBehaviorEnum.Inherit },
        tax: values.tax ?? { behavior: ConnectionBehaviorEnum.Inherit },
      },
    })

  return { savePayment, saveInvoicing, saveAdditionalIntegrations }
}
