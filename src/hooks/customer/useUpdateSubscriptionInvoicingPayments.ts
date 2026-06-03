import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useRef } from 'react'

import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import {
  buildSubscriptionDefaultValues,
  SubscriptionDefaultsSource,
} from '~/components/subscriptions/form/buildSubscriptionDefaultValues'
import { addToast } from '~/core/apolloClient'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { getTimezoneConfig } from '~/core/timezone'
import { subscriptionFormSchema } from '~/formValidation/subscriptionFormSchema'
import {
  LagoApiError,
  TimezoneEnum,
  UpdateSubscriptionInput,
  useUpdateSubscriptionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

type UseUpdateSubscriptionInvoicingPaymentsOptions = {
  subscription: SubscriptionDefaultsSource
  onSuccess?: () => void
}

export const useUpdateSubscriptionInvoicingPayments = ({
  subscription,
  onSuccess,
}: UseUpdateSubscriptionInvoicingPaymentsOptions) => {
  const { translate } = useInternationalization()
  const currentDate = useRef(
    DateTime.now().setZone(getTimezoneConfig(TimezoneEnum.TzUtc).name).startOf('day').toISO() || '',
  )

  const [updateSubscription] = useUpdateSubscriptionMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updateSubscription: updated }) {
      if (updated) {
        addToast({ severity: 'success', message: translate('text_65118a52df984447c186962e') })
        onSuccess?.()
      }
    },
  })

  const form = useAppForm({
    defaultValues: buildSubscriptionDefaultValues(
      subscription,
      FORM_TYPE_ENUM.edition,
      currentDate.current,
    ),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: subscriptionFormSchema },
    onSubmit: async ({ value }) => {
      const input: UpdateSubscriptionInput = {
        id: subscription?.id ?? '',
        paymentMethod: value.paymentMethod
          ? {
              paymentMethodId: value.paymentMethod.paymentMethodId,
              paymentMethodType: value.paymentMethod.paymentMethodType,
            }
          : undefined,
        invoiceCustomSection: toInvoiceCustomSectionReference(value.invoiceCustomSection),
      }

      await updateSubscription({ variables: { input } })
    },
  })

  const resetForm = () => {
    form.reset(
      buildSubscriptionDefaultValues(subscription, FORM_TYPE_ENUM.edition, currentDate.current),
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}
