import { useFilterContext } from '~/components/designSystem/Filters/context'
import { MultipleComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { FiltersFormValues } from '../types'

type FiltersItemWebhookEventTypesProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

// TODO: Replace static event types with dynamic data from `eventTypes { name description }` GraphQL query once available
const WEBHOOK_EVENT_TYPES = [
  'alert.triggered',
  'credit_note.created',
  'credit_note.generated',
  'credit_note.provider_refund_failure',
  'customer.accounting_provider_created',
  'customer.accounting_provider_error',
  'customer.checkout_url_generated',
  'customer.created',
  'customer.crm_provider_created',
  'customer.crm_provider_error',
  'customer.payment_provider_created',
  'customer.payment_provider_error',
  'customer.tax_provider_error',
  'customer.updated',
  'customer.vies_check',
  'dunning_campaign.finished',
  'event.error',
  'events.errors',
  'feature.created',
  'feature.deleted',
  'feature.updated',
  'fee.created',
  'fee.tax_provider_error',
  'integration.provider_error',
  'invoice.created',
  'invoice.drafted',
  'invoice.generated',
  'invoice.one_off_created',
  'invoice.paid_credit_added',
  'invoice.payment_dispute_lost',
  'invoice.payment_failure',
  'invoice.payment_overdue',
  'invoice.payment_status_updated',
  'invoice.resynced',
  'invoice.voided',
  'payment.requires_action',
  'payment_provider.error',
  'payment_receipt.created',
  'payment_receipt.generated',
  'payment_request.created',
  'payment_request.payment_failure',
  'payment_request.payment_status_updated',
  'plan.created',
  'plan.deleted',
  'plan.updated',
  'subscription.started',
  'subscription.terminated',
  'subscription.termination_alert',
  'subscription.trial_ended',
  'subscription.updated',
  'subscription.usage_threshold_reached',
  'wallet.created',
  'wallet.depleted_ongoing_balance',
  'wallet.terminated',
  'wallet.updated',
  'wallet_transaction.created',
  'wallet_transaction.payment_failure',
  'wallet_transaction.updated',
]

export const FiltersItemWebhookEventTypes = ({
  value,
  setFilterValue,
}: FiltersItemWebhookEventTypesProps) => {
  const { translate } = useInternationalization()
  const { displayInDialog } = useFilterContext()

  const selectedValues = (value || '')
    .split(',')
    .filter((v) => !!v)
    .map((v) => ({ value: v }))

  const handleChange = (eventTypes: { value: string }[]) => {
    setFilterValue(eventTypes.map((v) => v.value).join(','))
  }

  return (
    <MultipleComboBox
      PopperProps={{
        displayInDialog,
      }}
      disableClearable
      disableCloseOnSelect
      sortValues={false}
      placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
      data={WEBHOOK_EVENT_TYPES.map((eventType) => ({
        label: eventType,
        value: eventType,
      }))}
      onChange={handleChange}
      value={selectedValues}
    />
  )
}
