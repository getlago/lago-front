import { DetailsPage } from '~/components/layouts/DetailsPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCustomerInvoiceCustomSections } from '~/hooks/useCustomerInvoiceCustomSections'

import { InvoiceCustomSectionDisplay } from '../invoceCustomFooter/InvoiceCustomSectionDisplay'
import { InvoiceCustomSectionBasic } from '../invoceCustomFooter/types'
import { hasInvoiceCustomSectionsContent } from '../invoceCustomFooter/utils'
import { ViewTypeEnum } from '../paymentMethodsInvoiceSettings/types'

export const INVOICE_CUSTOM_FOOTER_SECTION = 'invoice-custom-footer-section'

interface SubscriptionInvoiceCustomSectionDetailsProps {
  customerId?: string
  selectedInvoiceCustomSections?: InvoiceCustomSectionBasic[] | null
  skipInvoiceCustomSections?: boolean | null
}

// Read-only display of the subscription's invoice custom sections (explicit
// selection, skip, or inherited customer/billing-entity default). Returns null
// when there's nothing to inherit or display.
export const SubscriptionInvoiceCustomSectionDetails = ({
  customerId,
  selectedInvoiceCustomSections,
  skipInvoiceCustomSections,
}: SubscriptionInvoiceCustomSectionDetailsProps): JSX.Element | null => {
  const { translate } = useInternationalization()

  const { data: customerIcsData } = useCustomerInvoiceCustomSections(customerId || '')

  const hasIcsContent = hasInvoiceCustomSectionsContent({
    skipInvoiceCustomSections,
    selectedInvoiceCustomSections,
    customerIcsData,
  })

  if (!hasIcsContent) {
    return null
  }

  return (
    <div data-test={INVOICE_CUSTOM_FOOTER_SECTION}>
      <DetailsPage.InfoGridItem
        label={translate('text_17628623882713knw0jtohiw')}
        value={
          <InvoiceCustomSectionDisplay
            selectedSections={selectedInvoiceCustomSections}
            skipSections={skipInvoiceCustomSections}
            customerId={customerId}
            viewType={ViewTypeEnum.Subscription}
          />
        }
      />
    </div>
  )
}
