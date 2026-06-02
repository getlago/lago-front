import { forwardRef, useImperativeHandle, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { SubscriptionInformationFormSection } from '~/components/subscriptions/form/SubscriptionInformationFormSection'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { SubscriptionInformationSectionFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionInformation } from '~/hooks/customer/useUpdateSubscriptionInformation'

const SUBSCRIPTION_INFORMATION_FORM_ID = 'subscription-information-drawer-form'

export interface SubscriptionInformationDrawerRef {
  openDrawer: () => void
  closeDrawer: () => void
}

type SubscriptionInformationDrawerProps = {
  subscription: SubscriptionInformationSectionFragment
}

export const SubscriptionInformationDrawer = forwardRef<
  SubscriptionInformationDrawerRef,
  SubscriptionInformationDrawerProps
>(({ subscription }, ref) => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const { form, resetForm } = useUpdateSubscriptionInformation({
    subscription,
    onSuccess() {
      drawer.close()
    },
  })

  const [shouldDisplaySubscriptionExternalId, setShouldDisplaySubscriptionExternalId] = useState(
    !!subscription.externalId,
  )
  const [shouldDisplaySubscriptionName, setShouldDisplaySubscriptionName] = useState(
    !!subscription.name,
  )

  const openDrawer = () => {
    resetForm()
    setShouldDisplaySubscriptionExternalId(!!subscription.externalId)
    setShouldDisplaySubscriptionName(!!subscription.name)

    const submitVoid = () => {
      void form.handleSubmit()
    }

    drawer.open({
      title: translate('text_62d7f6178ec94cd09370e63c'),
      form: { id: SUBSCRIPTION_INFORMATION_FORM_ID, submit: submitVoid },
      mainAction: (
        <form.Subscribe selector={({ canSubmit }) => canSubmit}>
          {(canSubmit) => (
            <Button
              data-test="subscription-information-drawer-save"
              onClick={submitVoid}
              disabled={!canSubmit}
            >
              {translate('text_17295436903260tlyb1gp1i7')}
            </Button>
          )}
        </form.Subscribe>
      ),
      children: (
        <SubscriptionInformationFormSection
          form={form}
          formType={FORM_TYPE_ENUM.edition}
          subscription={subscription}
          customerTimezone={subscription.customer?.applicableTimezone}
          selectedPlanInterval={subscription.plan?.interval}
          shouldDisplaySubscriptionExternalId={shouldDisplaySubscriptionExternalId}
          setShouldDisplaySubscriptionExternalId={setShouldDisplaySubscriptionExternalId}
          shouldDisplaySubscriptionName={shouldDisplaySubscriptionName}
          setShouldDisplaySubscriptionName={setShouldDisplaySubscriptionName}
        />
      ),
    })
  }

  useImperativeHandle(ref, () => ({
    openDrawer,
    closeDrawer: () => drawer.close(),
  }))

  return null
})

SubscriptionInformationDrawer.displayName = 'SubscriptionInformationDrawer'
