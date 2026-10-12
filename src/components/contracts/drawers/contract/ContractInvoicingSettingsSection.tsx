import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { buildInvoicingSettingsSummary } from '~/components/invoicingSettings/invoicingSettingsSummary'
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

  const summary = useMemo(
    () =>
      buildInvoicingSettingsSummary({
        consolidateInvoice,
        invoiceCustomSection,
        showCustomSection,
        translate,
      }),
    [consolidateInvoice, invoiceCustomSection, showCustomSection, translate],
  )

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
