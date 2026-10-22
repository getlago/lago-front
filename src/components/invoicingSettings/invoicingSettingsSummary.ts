import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'

export const INVOICING_SUMMARY_KEYS = {
  consolidate: 'text_1778745351091h7z5baw0ta6',
  isolate: 'text_1778745351091fxaqr5dwok8',
  skip: 'text_1782738644347z3azl4u1f15',
  apply: 'text_1782738644347qh5s13lol1p',
  fallback: 'text_1782738644347svkr94bf4aw',
}

export const getInvoiceCustomSectionSummaryKey = (
  value?: InvoiceCustomSectionInput | null,
): string => {
  if (value?.skipInvoiceCustomSections) return INVOICING_SUMMARY_KEYS.skip
  if (value?.invoiceCustomSections?.length) return INVOICING_SUMMARY_KEYS.apply

  return INVOICING_SUMMARY_KEYS.fallback
}

interface BuildInvoicingSettingsSummaryArgs {
  consolidateInvoice: boolean
  invoiceCustomSection?: InvoiceCustomSectionInput | null
  showCustomSection: boolean
  translate: (key: string) => string
}

// Shared by every Selector entry point into the invoicing-settings drawer
// (contracts, subscriptions, the non-subscription InvoicingSettingsSelector),
// so the preview text can't drift between them.
export const buildInvoicingSettingsSummary = ({
  consolidateInvoice,
  invoiceCustomSection,
  showCustomSection,
  translate,
}: BuildInvoicingSettingsSummaryArgs): string => {
  const parts = [
    translate(
      consolidateInvoice ? INVOICING_SUMMARY_KEYS.consolidate : INVOICING_SUMMARY_KEYS.isolate,
    ),
  ]

  if (showCustomSection) {
    parts.push(translate(getInvoiceCustomSectionSummaryKey(invoiceCustomSection)))
  }

  return parts.join(' • ')
}
