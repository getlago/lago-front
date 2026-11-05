import {
  buildCustomSectionSummary,
  buildInvoicingSettingsSummary,
  getInvoiceCustomSectionSummaryKey,
  INVOICING_SUMMARY_KEYS,
  INVOICING_SUMMARY_SEPARATOR,
} from '../invoicingSettingsSummary'

const translate = (key: string): string => key

describe('getInvoiceCustomSectionSummaryKey', () => {
  it('returns the skip key when sections are explicitly skipped', () => {
    expect(
      getInvoiceCustomSectionSummaryKey({
        invoiceCustomSections: [],
        skipInvoiceCustomSections: true,
      }),
    ).toBe(INVOICING_SUMMARY_KEYS.skip)
  })

  it('returns the apply key when sections are explicitly selected', () => {
    expect(
      getInvoiceCustomSectionSummaryKey({
        invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
        skipInvoiceCustomSections: false,
      }),
    ).toBe(INVOICING_SUMMARY_KEYS.apply)
  })

  it('returns the fallback key without a value', () => {
    expect(getInvoiceCustomSectionSummaryKey(undefined)).toBe(INVOICING_SUMMARY_KEYS.fallback)
  })
})

describe('buildInvoicingSettingsSummary', () => {
  it('joins consolidation and custom-section summaries when shown', () => {
    expect(
      buildInvoicingSettingsSummary({
        consolidateInvoice: false,
        invoiceCustomSection: {
          invoiceCustomSections: [{ id: 'cs_1', name: 'Bank details' }],
          skipInvoiceCustomSections: false,
        },
        showCustomSection: true,
        translate,
      }),
    ).toBe(`${INVOICING_SUMMARY_KEYS.isolate} • ${INVOICING_SUMMARY_KEYS.apply}`)
  })

  it('omits the custom-section summary when not shown', () => {
    expect(
      buildInvoicingSettingsSummary({
        consolidateInvoice: true,
        invoiceCustomSection: undefined,
        showCustomSection: false,
        translate,
      }),
    ).toBe(INVOICING_SUMMARY_KEYS.consolidate)
  })

  it('appends the payment term copy last', () => {
    expect(
      buildInvoicingSettingsSummary({
        consolidateInvoice: true,
        invoiceCustomSection: undefined,
        showCustomSection: true,
        paymentTermCopy: 'Net 30',
        translate,
      }),
    ).toBe(
      [INVOICING_SUMMARY_KEYS.consolidate, INVOICING_SUMMARY_KEYS.fallback, 'Net 30'].join(
        INVOICING_SUMMARY_SEPARATOR,
      ),
    )
  })

  it('appends the payment term copy even when the custom section is hidden', () => {
    expect(
      buildInvoicingSettingsSummary({
        consolidateInvoice: false,
        invoiceCustomSection: undefined,
        showCustomSection: false,
        paymentTermCopy: 'Net 30',
        translate,
      }),
    ).toBe([INVOICING_SUMMARY_KEYS.isolate, 'Net 30'].join(INVOICING_SUMMARY_SEPARATOR))
  })
})

describe('buildCustomSectionSummary', () => {
  it('shows only the custom-section part without a payment term', () => {
    expect(
      buildCustomSectionSummary({
        invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: true },
        translate,
      }),
    ).toBe(INVOICING_SUMMARY_KEYS.skip)
  })

  it('appends the payment term copy after the custom-section part', () => {
    expect(
      buildCustomSectionSummary({
        invoiceCustomSection: undefined,
        paymentTermCopy: 'Net 30',
        translate,
      }),
    ).toBe([INVOICING_SUMMARY_KEYS.fallback, 'Net 30'].join(INVOICING_SUMMARY_SEPARATOR))
  })
})
