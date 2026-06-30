import { gql } from '@apollo/client'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { PaymentInvoiceDetails } from '~/components/subscriptions/PaymentInvoiceDetails'
import {
  InvoicingPaymentsSectionFragment,
  SubscriptionForSubscriptionEditFormFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useInvoicingPaymentsDrawer } from './drawers/useInvoicingPaymentsDrawer'

gql`
  fragment InvoicingPaymentsSection on Subscription {
    id
    consolidateInvoice
    paymentMethodType
    paymentMethod {
      id
    }
    skipInvoiceCustomSections
    selectedInvoiceCustomSections {
      id
      name
    }
    customer {
      id
      externalId
    }
    ...SubscriptionForSubscriptionEditForm
  }

  ${SubscriptionForSubscriptionEditFormFragmentDoc}
`

type InvoicingPaymentsSectionProps = {
  subscription: InvoicingPaymentsSectionFragment
}

export const InvoicingPaymentsSection = ({ subscription }: InvoicingPaymentsSectionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer } = useInvoicingPaymentsDrawer(subscription)

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1762862388271au34vz50g8i')}
        description={translate('text_1779198780030g64up7d4imi')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          startIcon: 'pen',
          onClick: openDrawer,
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
      />
      <DetailsPage.InfoGridItem
        label={translate('text_177874535109128tmqdq682k')}
        value={translate(
          subscription.consolidateInvoice
            ? 'text_1778745351091h7z5baw0ta6'
            : 'text_1778745351091fxaqr5dwok8',
        )}
      />
      <PaymentInvoiceDetails
        hideSectionTitle
        selectedPaymentMethod={{
          paymentMethodType: subscription.paymentMethodType,
          paymentMethodId: subscription.paymentMethod?.id,
        }}
        externalCustomerId={subscription.customer?.externalId}
        customerId={subscription.customer?.id}
        selectedInvoiceCustomSections={subscription.selectedInvoiceCustomSections}
        skipInvoiceCustomSections={subscription.skipInvoiceCustomSections}
      />
    </section>
  )
}
