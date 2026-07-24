import { useMemo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoicingSettingsDrawer, InvoicingSettingsDrawerRef } from './InvoicingSettingsDrawer'

export const INVOICING_SETTINGS_SELECTOR_TEST_ID = 'invoicing-settings-selector'

export const INVOICING_SUMMARY_KEYS = {
  skip: 'text_1782738644347z3azl4u1f15',
  apply: 'text_1782738644347qh5s13lol1p',
  fallback: 'text_1782738644347svkr94bf4aw',
}

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
  const drawerRef = useRef<InvoicingSettingsDrawerRef>(null)

  const showCustomSection = !!customerId

  const summary = useMemo(() => {
    if (value?.skipInvoiceCustomSections) return translate(INVOICING_SUMMARY_KEYS.skip)
    if (value?.invoiceCustomSections?.length) return translate(INVOICING_SUMMARY_KEYS.apply)

    return translate(INVOICING_SUMMARY_KEYS.fallback)
  }, [value, translate])

  return (
    <>
      <Selector
        icon="document"
        title={translate('text_17423672025282dl7iozy1ru')}
        subtitle={summary}
        endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
        onClick={() => drawerRef.current?.openDrawer({ invoiceCustomSection: value })}
        data-test={dataTest}
      />

      <InvoicingSettingsDrawer
        ref={drawerRef}
        viewType={viewType}
        customerId={customerId}
        showCustomSection={showCustomSection}
        onSave={({ invoiceCustomSection }) => onChange(invoiceCustomSection)}
      />
    </>
  )
}
