import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getInvoiceCustomSectionSummaryKey } from './invoicingSettingsSummary'
import { useInvoicingSettingsDrawer } from './useInvoicingSettingsDrawer'

export { INVOICING_SUMMARY_KEYS } from './invoicingSettingsSummary'

export const INVOICING_SETTINGS_SELECTOR_TEST_ID = 'invoicing-settings-selector'

interface InvoicingSettingsSelectorProps {
  viewType: ViewTypeEnum
  customerId?: string
  value: InvoiceCustomSectionInput | undefined
  onChange: (value: InvoiceCustomSectionInput) => void
  'data-test'?: string
}

/**
 * Controlled (value/onChange) entry point for the per-object invoicing
 * settings on NON-subscription billing objects (wallet, recurring rule,
 * top-up, one-off invoice): invoice custom sections only — these payloads
 * have no invoice consolidation. The subscription form keeps its own
 * withForm-bound InvoicingSettingsSection (with consolidation).
 */
export const InvoicingSettingsSelector = ({
  viewType,
  customerId,
  value,
  onChange,
  'data-test': dataTest = INVOICING_SETTINGS_SELECTOR_TEST_ID,
}: InvoicingSettingsSelectorProps) => {
  const { translate } = useInternationalization()

  const showCustomSection = !!customerId

  const { openDrawer } = useInvoicingSettingsDrawer({
    viewType,
    customerId,
    showCustomSection,
    onSave: ({ invoiceCustomSection }) => onChange(invoiceCustomSection),
  })

  const summary = useMemo(
    () => translate(getInvoiceCustomSectionSummaryKey(value)),
    [value, translate],
  )

  return (
    <Selector
      icon="document"
      title={translate('text_17423672025282dl7iozy1ru')}
      subtitle={summary}
      endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
      onClick={() => openDrawer({ invoiceCustomSection: value })}
      data-test={dataTest}
    />
  )
}
