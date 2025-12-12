import { DetailsPage } from '~/components/layouts/DetailsPage'
import { formatPaymentMethodDetails } from '~/core/formats/formatPaymentMethodDetails'
import { InvoiceCustomSection } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePaymentMethodsList } from '~/hooks/customer/usePaymentMethodsList'

import { InvoiceCustomSectionDisplay } from '../invoceCustomFooter/InvoiceCustomSectionDisplay'
import { SelectedPaymentMethod } from '../paymentMethodSelection/types'
import { useDisplayedPaymentMethod } from '../paymentMethodSelection/useDisplayedPaymentMethod'

interface PaymentInvoiceDetailsProps {
  selectedPaymentMethod: SelectedPaymentMethod
  externalCustomerId?: string
  customerId?: string
  selectedInvoiceCustomSections?: Pick<InvoiceCustomSection, 'id' | 'name'>[] | null
  skipInvoiceCustomSections?: boolean | null
}

export const SECTION_TITLE = 'payment-invoice-details-section-title'
export const MANUAL_PAYMENT_METHOD_TEST_ID = 'manual-payment-method'
export const INHERITED_BADGE_TEST_ID = 'inherited-badge'
export const INVOICE_CUSTOM_FOOTER_SECTION = 'invoice-custom-footer-section'

export const PaymentInvoiceDetails = ({
  selectedPaymentMethod,
  externalCustomerId,
  customerId,
  selectedInvoiceCustomSections,
  skipInvoiceCustomSections,
}: PaymentInvoiceDetailsProps): JSX.Element | null => {
  const { translate } = useInternationalization()

  const { data: paymentMethodsList } = usePaymentMethodsList({
    externalCustomerId: externalCustomerId || '',
    withDeleted: false,
  })

  const displayedPaymentMethod = useDisplayedPaymentMethod(
    selectedPaymentMethod,
    paymentMethodsList,
  )

  // Format the displayed payment method as a string
  let formattedPaymentMethodDetails = ''

  if (displayedPaymentMethod.isManual) {
    formattedPaymentMethodDetails = translate('text_173799550683709p2rqkoqd5')
  } else if (displayedPaymentMethod.paymentMethod) {
    formattedPaymentMethodDetails =
      formatPaymentMethodDetails(displayedPaymentMethod.paymentMethod.details) || ''
  }

  // Add inherited badge if needed
  const inheritedText = displayedPaymentMethod.isInherited
    ? ` (${translate('text_1764327933607jgtpungo2pp')})`
    : ''

  // Check if we have content to display
  const hasPaymentMethod = !!formattedPaymentMethodDetails

  const hasIcsContent =
    skipInvoiceCustomSections === true || !!selectedInvoiceCustomSections?.length || !!customerId

  // Return null if nothing to display
  if (!hasPaymentMethod && !hasIcsContent) return null

  return (
    <div className="flex flex-col">
      <DetailsPage.SectionTitle variant="subhead1" noWrap data-test={SECTION_TITLE}>
        {translate('text_17634566456760qoj7hs7jrh')}
      </DetailsPage.SectionTitle>

      {hasPaymentMethod && (
        <div>
          <DetailsPage.InfoGridItem
            className="mb-4"
            label={translate('text_17440371192353kif37ol194')}
            value={
              <span>
                {displayedPaymentMethod.isManual ? (
                  <span data-test={MANUAL_PAYMENT_METHOD_TEST_ID}>
                    {formattedPaymentMethodDetails}
                  </span>
                ) : (
                  formattedPaymentMethodDetails
                )}
                {displayedPaymentMethod.isInherited && (
                  <span data-test={INHERITED_BADGE_TEST_ID}>{inheritedText}</span>
                )}
              </span>
            }
          />
        </div>
      )}

      {hasIcsContent && (
        <div data-test={INVOICE_CUSTOM_FOOTER_SECTION}>
          <DetailsPage.InfoGridItem
            label={translate('text_17628623882713knw0jtohiw')}
            value={
              <InvoiceCustomSectionDisplay
                selectedSections={selectedInvoiceCustomSections}
                skipSections={skipInvoiceCustomSections}
                customerId={customerId}
                viewType="subscription"
              />
            }
          />
        </div>
      )}
    </div>
  )
}
