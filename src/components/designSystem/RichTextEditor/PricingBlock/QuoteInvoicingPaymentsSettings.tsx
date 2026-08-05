import type { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { InvoicingSettingsSelector } from '~/components/invoicingSettings/InvoicingSettingsSelector'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import type { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { PaymentSettingsSelector } from '~/components/paymentSettings/PaymentSettingsSelector'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import type { InvoicingSettings } from '~/core/serializers/serializeQuotePlanBillingItems'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import type { QuoteCustomer } from '~/pages/quotes/hooks/useSubscriptionPricingDrawer'

interface QuoteInvoicingPaymentsSettingsProps {
  customer: QuoteCustomer
  value: InvoicingSettings
  onChange: (value: InvoicingSettings) => void
}

const parseInvoiceCustomFooter = (raw: string): InvoiceCustomSectionInput | undefined => {
  if (!raw) return undefined

  try {
    return JSON.parse(raw) as InvoiceCustomSectionInput
  } catch {
    return undefined
  }
}

/**
 * Bridges the quote's flat invoicing state (`paymentMethodId` +
 * `invoiceCustomFooter` JSON string) with the shared ING-497 selectors, which
 * are controlled with rich object shapes. Renders the two selector cards inside
 * the existing "Invoicing & payments settings" section.
 * `withInvoiceConsolidation` is intentionally omitted — the quote payload
 * has no `consolidateInvoice`.
 */
export const QuoteInvoicingPaymentsSettings = ({
  customer,
  value,
  onChange,
}: QuoteInvoicingPaymentsSettingsProps): JSX.Element => {
  const { translate } = useInternationalization()

  const handlePaymentChange = (paymentMethod: SelectedPaymentMethod): void => {
    onChange({ ...value, paymentMethodId: paymentMethod?.paymentMethodId ?? '' })
  }

  const handleInvoicingChange = (section: InvoiceCustomSectionInput): void => {
    onChange({ ...value, invoiceCustomFooter: section ? JSON.stringify(section) : '' })
  }

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate('text_17791987800309g2j0x3t2n0')}
        description={translate('text_1781099100337xfqzt0jxvj5')}
      />

      <InvoicingSettingsSelector
        viewType={ViewTypeEnum.Subscription}
        customerId={customer.id}
        value={parseInvoiceCustomFooter(value.invoiceCustomFooter)}
        onChange={handleInvoicingChange}
      />

      <PaymentSettingsSelector
        viewType={ViewTypeEnum.Subscription}
        externalCustomerId={customer.externalId}
        value={value.paymentMethodId ? { paymentMethodId: value.paymentMethodId } : null}
        onChange={handlePaymentChange}
      />
    </CenteredPage.PageSection>
  )
}
