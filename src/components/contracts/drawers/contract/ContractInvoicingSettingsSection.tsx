import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { useInvoicingSettingsDrawer } from '~/components/invoicingSettings/useInvoicingSettingsDrawer'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CONTRACT_INVOICING_SETTINGS_TEST_ID = 'contract-invoicing-settings-selector'

type ContractInvoicingSettingsSectionProps = {
  consolidateInvoice: boolean
  invoiceCustomSection: InvoiceCustomSectionInput
  customerId?: string
  onChange: (consolidateInvoice: boolean) => void
  onInvoiceCustomSectionChange: (invoiceCustomSection: InvoiceCustomSectionInput) => void
}

export const ContractInvoicingSettingsSection = ({
  consolidateInvoice,
  invoiceCustomSection,
  customerId,
  onChange,
  onInvoiceCustomSectionChange,
}: ContractInvoicingSettingsSectionProps) => {
  const { translate } = useInternationalization()
  const showCustomSection = !!customerId

  const { openDrawer } = useInvoicingSettingsDrawer({
    viewType: ViewTypeEnum.Contract,
    customerId,
    showCustomSection,
    withInvoiceConsolidation: true,
    onSave: ({ consolidateInvoice: nextConsolidateInvoice, invoiceCustomSection: nextIcs }) => {
      onChange(nextConsolidateInvoice)
      onInvoiceCustomSectionChange(nextIcs)
    },
  })

  const summary = useMemo(() => {
    const parts = [
      translate(
        consolidateInvoice ? 'text_1778745351091h7z5baw0ta6' : 'text_1778745351091fxaqr5dwok8',
      ),
    ]

    if (showCustomSection) {
      let icsKey = 'text_1782738644347svkr94bf4aw'

      if (invoiceCustomSection.skipInvoiceCustomSections) {
        icsKey = 'text_1782738644347z3azl4u1f15'
      } else if (invoiceCustomSection.invoiceCustomSections.length) {
        icsKey = 'text_1782738644347qh5s13lol1p'
      }

      parts.push(translate(icsKey))
    }

    return parts.join(' • ')
  }, [consolidateInvoice, invoiceCustomSection, showCustomSection, translate])

  return (
    <Selector
      icon="document"
      title={translate('text_17423672025282dl7iozy1ru')}
      subtitle={summary}
      endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
      onClick={() => openDrawer({ consolidateInvoice, invoiceCustomSection })}
      data-test={CONTRACT_INVOICING_SETTINGS_TEST_ID}
    />
  )
}
