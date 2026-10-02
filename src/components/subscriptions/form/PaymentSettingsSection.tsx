import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { deriveBehavior, PaymentMethodBehavior } from '~/components/paymentMethodSelection/types'
import { ConnectionPaymentSettingsSelector } from '~/components/paymentSettings/connectionFirst/ConnectionPaymentSettingsSelector'
import { usePaymentSettingsDrawer } from '~/components/paymentSettings/usePaymentSettingsDrawer'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { FeatureFlagEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { buildSubscriptionDefaultValues } from './buildSubscriptionDefaultValues'

const TYPING_PLACEHOLDER_DATE = '2026-01-01'

const SUMMARY_KEY_BY_BEHAVIOR: Record<PaymentMethodBehavior, string> = {
  [PaymentMethodBehavior.FALLBACK]: 'text_1782801373795rfpcgchgkv2',
  [PaymentMethodBehavior.SPECIFIC]: 'text_1782801373795gxafl6ekcte',
  [PaymentMethodBehavior.MANUAL]: 'text_1782801373795pwkwintj6s8',
}

interface PaymentSettingsSectionExtraProps {
  externalCustomerId: string
  customerId?: string
}

const paymentSettingsSectionDefaultProps: PaymentSettingsSectionExtraProps = {
  externalCustomerId: '',
}

// Entry point for the subscription payment settings: a Selector card previewing
// the current choice that opens the payment settings drawer. Keeps the preview and
// the save wiring in one place (mirrors InvoicingSettingsSection).
export const PaymentSettingsSection = withForm({
  defaultValues: buildSubscriptionDefaultValues(
    undefined,
    FORM_TYPE_ENUM.creation,
    TYPING_PLACEHOLDER_DATE,
  ),
  props: paymentSettingsSectionDefaultProps,
  render: function PaymentSettingsSectionRender({ form, externalCustomerId, customerId }) {
    const { translate } = useInternationalization()
    const { hasFeatureFlag } = useOrganizationInfos()
    const hasMultiConnection = hasFeatureFlag(FeatureFlagEnum.MultiConnection)

    const paymentMethod = useStore(form.store, (s) => s.values.paymentMethod)

    const paymentConnection = useStore(form.store, (s) => s.values.paymentConnection)

    const { openDrawer } = usePaymentSettingsDrawer({
      viewType: ViewTypeEnum.Subscription,
      externalCustomerId,
      onSave: ({ paymentMethod: nextPaymentMethod }) => {
        form.setFieldValue('paymentMethod', nextPaymentMethod)
      },
    })

    const summary = useMemo(() => {
      const behavior = deriveBehavior(paymentMethod)

      if (hasMultiConnection && behavior === PaymentMethodBehavior.FALLBACK) {
        return translate('text_1789374590507j8hnidtlhwy')
      }

      return translate(SUMMARY_KEY_BY_BEHAVIOR[behavior])
    }, [paymentMethod, translate, hasMultiConnection])

    if (hasMultiConnection && customerId) {
      return (
        <ConnectionPaymentSettingsSelector
          viewType={ViewTypeEnum.Subscription}
          customerId={customerId}
          connection={paymentConnection}
          paymentMethod={paymentMethod}
          paymentMethodSummary={summary}
          onChange={({ connection, paymentMethod: nextPaymentMethod }) => {
            form.setFieldValue('paymentConnection', connection)
            form.setFieldValue('paymentMethod', nextPaymentMethod)
          }}
        />
      )
    }

    return (
      <Selector
        icon="coin-dollar"
        title={translate('text_17828013737948943pe3k8nc')}
        subtitle={summary}
        endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
        onClick={() => openDrawer({ paymentMethod })}
        data-test="payment-settings-selector"
      />
    )
  },
})
