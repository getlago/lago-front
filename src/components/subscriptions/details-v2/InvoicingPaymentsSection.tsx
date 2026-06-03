import { gql } from '@apollo/client'

import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { PaymentInvoiceDetails } from '~/components/subscriptions/PaymentInvoiceDetails'
import {
  FeatureFlagEnum,
  InvoicingPaymentsSectionFragment,
  SubscriptionForSubscriptionEditFormFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useInvoicingPaymentsDrawer } from './drawers/useInvoicingPaymentsDrawer'

gql`
  fragment InvoicingPaymentsSection on Subscription {
    id
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
  const { hasFeatureFlag } = useOrganizationInfos()
  const { openDrawer } = useInvoicingPaymentsDrawer(subscription)

  // Gated to match today's SubscriptionDetailsOverview PaymentInvoiceDetails block.
  if (!hasFeatureFlag(FeatureFlagEnum.MultiplePaymentMethods)) {
    return null
  }

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1762862388271au34vz50g8i')}
        description={translate('text_1779198780030g64up7d4imi')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          onClick: openDrawer,
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
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
