import { useMemo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import {
  deriveBehavior,
  PaymentMethodBehavior,
  SelectedPaymentMethod,
} from '~/components/paymentMethodSelection/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PaymentSettingsDrawer, PaymentSettingsDrawerRef } from './PaymentSettingsDrawer'

const SUMMARY_KEY_BY_BEHAVIOR: Record<PaymentMethodBehavior, string> = {
  [PaymentMethodBehavior.FALLBACK]: 'text_1782801373795rfpcgchgkv2',
  [PaymentMethodBehavior.SPECIFIC]: 'text_1782801373795gxafl6ekcte',
  [PaymentMethodBehavior.MANUAL]: 'text_1782801373795pwkwintj6s8',
}

interface PaymentSettingsSelectorProps {
  viewType: ViewTypeEnum
  externalCustomerId: string
  value: SelectedPaymentMethod
  onChange: (value: SelectedPaymentMethod) => void
  'data-test'?: string
}

/**
 * Controlled (value/onChange) entry point for the per-object payment
 * settings: a Selector card previewing the current choice that opens the
 * shared PaymentSettingsDrawer. Mountable on any form (wallet, top-up,
 * one-off invoice…) — the subscription form keeps its own withForm-bound
 * PaymentSettingsSection.
 */
export const PaymentSettingsSelector = ({
  viewType,
  externalCustomerId,
  value,
  onChange,
  'data-test': dataTest = 'payment-settings-selector',
}: PaymentSettingsSelectorProps) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<PaymentSettingsDrawerRef>(null)

  const summary = useMemo(
    () => translate(SUMMARY_KEY_BY_BEHAVIOR[deriveBehavior(value)]),
    [value, translate],
  )

  return (
    <>
      <Selector
        icon="coin-dollar"
        title={translate('text_17828013737948943pe3k8nc')}
        subtitle={summary}
        endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
        onClick={() => drawerRef.current?.openDrawer({ paymentMethod: value })}
        data-test={dataTest}
      />

      <PaymentSettingsDrawer
        ref={drawerRef}
        viewType={viewType}
        externalCustomerId={externalCustomerId}
        onSave={({ paymentMethod }) => onChange(paymentMethod)}
      />
    </>
  )
}
