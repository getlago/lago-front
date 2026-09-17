import { useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import {
  InvoicingSettingsDrawer,
  InvoicingSettingsDrawerRef,
} from '~/components/invoicingSettings/InvoicingSettingsDrawer'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CONTRACT_INVOICING_SETTINGS_TEST_ID = 'contract-invoicing-settings-selector'

type ContractInvoicingSettingsSectionProps = {
  consolidateInvoice: boolean
  onChange: (consolidateInvoice: boolean) => void
}

export const ContractInvoicingSettingsSection = ({
  consolidateInvoice,
  onChange,
}: ContractInvoicingSettingsSectionProps) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<InvoicingSettingsDrawerRef>(null)

  return (
    <>
      <Selector
        icon="document"
        title={translate('text_17423672025282dl7iozy1ru')}
        subtitle={translate(
          consolidateInvoice ? 'text_1778745351091h7z5baw0ta6' : 'text_1778745351091fxaqr5dwok8',
        )}
        endContent={<Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />}
        onClick={() => drawerRef.current?.openDrawer({ consolidateInvoice })}
        data-test={CONTRACT_INVOICING_SETTINGS_TEST_ID}
      />

      <InvoicingSettingsDrawer
        ref={drawerRef}
        viewType={ViewTypeEnum.Contract}
        showCustomSection={false}
        withInvoiceConsolidation
        onSave={({ consolidateInvoice: nextConsolidateInvoice }) =>
          onChange(nextConsolidateInvoice)
        }
      />
    </>
  )
}
