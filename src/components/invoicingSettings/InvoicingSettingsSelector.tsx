import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

import { buildInvoicingSettingsSummary } from './invoicingSettingsSummary'
import { useInvoicingSettingsDrawer } from './useInvoicingSettingsDrawer'

export { INVOICING_SUMMARY_KEYS } from './invoicingSettingsSummary'

export const INVOICING_SETTINGS_SELECTOR_TEST_ID = 'invoicing-settings-selector'

/** Controlled payment term override of the object (wallet, one-off invoice) that owns one. */
export type InvoicingSettingsPaymentTermProps = {
  value: PaymentTermFormValues
  onChange: (value: PaymentTermFormValues) => void
  inheritedFrom: PaymentTermInheritedFrom | undefined
}

interface InvoicingSettingsSelectorProps {
  viewType: ViewTypeEnum
  customerId?: string
  value: InvoiceCustomSectionInput | undefined
  onChange: (value: InvoiceCustomSectionInput) => void
  paymentTerm?: InvoicingSettingsPaymentTermProps
  'data-test'?: string
}

// Not for subscriptions: their form keeps its own withForm-bound
// InvoicingSettingsSection, which also carries invoice consolidation.
export const InvoicingSettingsSelector = ({
  viewType,
  customerId,
  value,
  onChange,
  paymentTerm,
  'data-test': dataTest = INVOICING_SETTINGS_SELECTOR_TEST_ID,
}: InvoicingSettingsSelectorProps) => {
  const { translate } = useInternationalization()
  const { getPaymentTermFormValuesCopy } = usePaymentTerm()

  const showCustomSection = !!customerId

  const { openDrawer } = useInvoicingSettingsDrawer({
    viewType,
    customerId,
    showCustomSection,
    withPaymentTerm: !!paymentTerm,
    paymentTermInheritedFrom: paymentTerm?.inheritedFrom,
    onSave: ({ invoiceCustomSection, paymentTerm: nextPaymentTerm }) => {
      onChange(invoiceCustomSection)
      paymentTerm?.onChange(nextPaymentTerm)
    },
  })

  const summary = buildInvoicingSettingsSummary({
    invoiceCustomSection: value,
    showCustomSection: true,
    paymentTermCopy: paymentTerm
      ? getPaymentTermFormValuesCopy(paymentTerm.value, paymentTerm.inheritedFrom)
      : undefined,
    translate,
  })

  return (
    <Selector
      icon="document"
      title={translate('text_17423672025282dl7iozy1ru')}
      subtitle={summary}
      endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
      onClick={() => openDrawer({ invoiceCustomSection: value, paymentTerm: paymentTerm?.value })}
      data-test={dataTest}
    />
  )
}
