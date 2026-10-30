import { useMemo } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector } from '~/components/designSystem/Selector'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'

import { useInvoicingSettingsDrawer } from './useInvoicingSettingsDrawer'

export const INVOICING_SETTINGS_SELECTOR_TEST_ID = 'invoicing-settings-selector'

export const INVOICING_SUMMARY_KEYS = {
  skip: 'text_1782738644347z3azl4u1f15',
  apply: 'text_1782738644347qh5s13lol1p',
  fallback: 'text_1782738644347svkr94bf4aw',
}

/** Controlled payment term override of the object (wallet, one-off invoice) that owns one. */
export type InvoicingSettingsPaymentTermProps = {
  value: PaymentTermFormValues
  onChange: (value: PaymentTermFormValues) => void
  inheritedFrom: PaymentTermInheritedFrom
}

interface InvoicingSettingsSelectorProps {
  viewType: ViewTypeEnum
  customerId?: string
  value: InvoiceCustomSectionInput | undefined
  onChange: (value: InvoiceCustomSectionInput) => void
  paymentTerm?: InvoicingSettingsPaymentTermProps
  'data-test'?: string
}

/**
 * Controlled (value/onChange) entry point for the per-object invoicing
 * settings on NON-subscription billing objects (wallet, recurring rule,
 * top-up, one-off invoice): invoice custom sections, plus the payment term
 * on the objects that carry one — these payloads have no invoice
 * consolidation. The subscription form keeps its own withForm-bound
 * InvoicingSettingsSection (with consolidation).
 */
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
    paymentTermInheritedFrom: paymentTerm?.inheritedFrom,
    onSave: ({ invoiceCustomSection, paymentTerm: nextPaymentTerm }) => {
      onChange(invoiceCustomSection)
      paymentTerm?.onChange(nextPaymentTerm)
    },
  })

  const summary = useMemo(() => {
    const getCustomSectionSummary = (): string => {
      if (value?.skipInvoiceCustomSections) return translate(INVOICING_SUMMARY_KEYS.skip)
      if (value?.invoiceCustomSections?.length) return translate(INVOICING_SUMMARY_KEYS.apply)

      return translate(INVOICING_SUMMARY_KEYS.fallback)
    }

    const parts = [getCustomSectionSummary()]

    if (paymentTerm) {
      parts.push(getPaymentTermFormValuesCopy(paymentTerm.value, paymentTerm.inheritedFrom))
    }

    return parts.join(' • ')
  }, [value, paymentTerm, translate, getPaymentTermFormValuesCopy])

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
