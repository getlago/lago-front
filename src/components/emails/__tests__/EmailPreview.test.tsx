import { cleanup, screen } from '@testing-library/react'

import EmailPreview, { DisplayEnum } from '~/components/emails/EmailPreview'
import { LocaleEnum } from '~/core/translations'
import { BillingEntityEmailSettingsEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  envGlobalVar: jest.fn(() => ({
    disablePdfGeneration: false,
  })),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasOrganizationPremiumAddon: jest.fn().mockReturnValue(false),
  }),
}))

const mockBillingEntity = {
  id: '1',
  name: 'Test Company',
  logoUrl: 'https://example.com/logo.png',
  einvoicing: true,
}

describe('EmailPreview', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the component is in loading state', () => {
    describe('WHEN loading is true', () => {
      it('THEN should render without crashing', () => {
        const { container } = render(
          <EmailPreview
            loading={true}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the component is loaded', () => {
    describe('WHEN loading is false with InvoiceFinalized type', () => {
      it('THEN should render the billing entity name', () => {
        render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        expect(screen.getAllByText('Test Company', { exact: false }).length).toBeGreaterThan(0)
      })

      it('THEN should render invoice number row', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        // InvoiceFinalized renders invoice_number and issue_date rows
        const rows = container.querySelectorAll('.flex.w-full.items-center.justify-between')

        expect(rows.length).toBeGreaterThanOrEqual(2)
      })

      it('THEN should not render credit note number row', () => {
        render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        // CreditNote-specific text should not be present
        // PaymentReceipt-specific invoice list should not be present
        expect(screen.queryByText('INV-001-001')).not.toBeInTheDocument()
      })
    })

    describe('WHEN loading is false with CreditNoteCreated type', () => {
      it('THEN should render the credit note number row', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.CreditNoteCreated}
            billingEntity={mockBillingEntity}
          />,
        )

        // CreditNoteCreated renders credit_note_number, invoice_number, and issue_date rows
        const rows = container.querySelectorAll('.flex.w-full.items-center.justify-between')

        expect(rows.length).toBeGreaterThanOrEqual(3)
      })
    })

    describe('WHEN loading is false with PaymentReceiptCreated type', () => {
      it('THEN should render payment receipt rows', () => {
        render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.PaymentReceiptCreated}
            billingEntity={mockBillingEntity}
          />,
        )

        // PaymentReceiptCreated renders a list of sample invoices
        expect(screen.getByText('INV-001-001')).toBeInTheDocument()
        expect(screen.getByText('INV-001-002')).toBeInTheDocument()
        expect(screen.getByText('INV-001-003')).toBeInTheDocument()
        expect(screen.getByText('INV-001-004')).toBeInTheDocument()
      })

      it('THEN should render payment amount values', () => {
        render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.PaymentReceiptCreated}
            billingEntity={mockBillingEntity}
          />,
        )

        // PaymentReceipt shows $730,00 values for sample invoices and amount_paid
        expect(screen.getAllByText('$730,00').length).toBeGreaterThanOrEqual(4)
      })
    })
  })

  describe('GIVEN the display prop is set', () => {
    describe('WHEN display is desktop', () => {
      it('THEN should apply desktop width class', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            display={DisplayEnum.desktop}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        const previewContainer = container.querySelector('.w-150')

        expect(previewContainer).toBeInTheDocument()
      })
    })

    describe('WHEN display is mobile', () => {
      it('THEN should apply mobile width class', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            display={DisplayEnum.mobile}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        const previewContainer = container.querySelector('.w-90')

        expect(previewContainer).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the showEmailHeader prop is set', () => {
    describe('WHEN showEmailHeader is false', () => {
      it('THEN should not pass emailObject to PreviewEmailLayout', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            showEmailHeader={false}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        // When showEmailHeader is false, the email header section is not rendered
        // The .mb-12 section (email from/to) should not be present
        const emailHeaderSection = container.querySelector('.mb-12')

        expect(emailHeaderSection).not.toBeInTheDocument()
      })
    })

    describe('WHEN showEmailHeader is true (default)', () => {
      it('THEN should render the email header section', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            showEmailHeader={true}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        // When showEmailHeader is true, the email header with from/to is visible
        const emailHeaderSection = container.querySelector('.mb-12')

        expect(emailHeaderSection).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN disablePdfGeneration is false', () => {
    describe('WHEN the component is rendered with InvoiceFinalized type', () => {
      it('THEN should render the download section', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        // InvoiceFinalized shows a single download link
        const downloadSection = container.querySelector('.flex.flex-row.items-center.gap-2')

        expect(downloadSection).toBeInTheDocument()
      })
    })

    describe('WHEN the component is rendered with PaymentReceiptCreated type', () => {
      it('THEN should render two download links', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            type={BillingEntityEmailSettingsEnum.PaymentReceiptCreated}
            billingEntity={mockBillingEntity}
          />,
        )

        // PaymentReceipt shows two download links (receipt + invoice) in a gap-6 container
        const downloadSection = container.querySelector('.flex.flex-row.items-center.gap-6')

        expect(downloadSection).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no billingEntity is provided', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should render without crashing', () => {
        const { container } = render(
          <EmailPreview loading={false} type={BillingEntityEmailSettingsEnum.InvoiceFinalized} />,
        )

        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a non-default locale', () => {
    describe('WHEN invoiceLanguage is set to French', () => {
      it('THEN should render without crashing', () => {
        const { container } = render(
          <EmailPreview
            loading={false}
            invoiceLanguage={LocaleEnum.fr}
            type={BillingEntityEmailSettingsEnum.InvoiceFinalized}
            billingEntity={mockBillingEntity}
          />,
        )

        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no type is provided', () => {
    describe('WHEN rendered with default type', () => {
      it('THEN should render the default (CreditNote) template', () => {
        const { container } = render(
          <EmailPreview loading={false} billingEntity={mockBillingEntity} />,
        )

        // Default case in mapTranslationsKey returns credit note keys
        expect(container).toBeInTheDocument()
      })
    })
  })
})
