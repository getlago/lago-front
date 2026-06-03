import { DateTime } from 'luxon'

import {
  SubscriptionUpdateFormOptions,
  useUpdateSubscriptionForm,
} from '~/hooks/customer/useUpdateSubscriptionForm'

export const useUpdateSubscriptionInformation = ({
  subscription,
  onSuccess,
}: SubscriptionUpdateFormOptions) =>
  useUpdateSubscriptionForm({
    subscription,
    onSuccess,
    buildInput: (value) => ({
      id: subscription?.id ?? '',
      name: value.name || undefined,
      subscriptionAt: DateTime.fromISO(value.subscriptionAt).toUTC().toISO(),
      endingAt: value.endingAt ? DateTime.fromISO(value.endingAt).toUTC().toISO() : null,
    }),
  })
