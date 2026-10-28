import { gql } from '@apollo/client'

import { useInvoicingSettingsDrawer } from '~/components/invoicingSettings/useInvoicingSettingsDrawer'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  getInheritedPaymentTerm,
  paymentTermFormValuesFromTerm,
} from '~/components/paymentTerms/utils'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { SubscriptionInvoiceCustomSectionDetails } from '~/components/subscriptions/SubscriptionInvoiceCustomSectionDetails'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { SubscriptionInvoiceSectionFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useUpdateSubscriptionSettings } from '~/hooks/customer/useUpdateSubscriptionSettings'
import { useBillingEntityById } from '~/hooks/useBillingEntitiesOptions'
import { usePaymentTerm } from '~/hooks/usePaymentTerm'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment SubscriptionInvoiceSection on Subscription {
    id
    consolidateInvoice
    skipInvoiceCustomSections
    selectedInvoiceCustomSections {
      id
      name
    }
    billingEntityId
    paymentTerm {
      termType
      days
      dayOfMonth
      monthOffset
    }
    customer {
      id
      externalId
      paymentTerm {
        termType
        days
        dayOfMonth
        monthOffset
      }
      billingEntity {
        id
        paymentTerm {
          termType
          days
          dayOfMonth
          monthOffset
        }
      }
    }
  }
`

type SubscriptionInvoiceSectionProps = {
  subscription: SubscriptionInvoiceSectionFragment
}

export const SubscriptionInvoiceSection = ({ subscription }: SubscriptionInvoiceSectionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { saveInvoicing } = useUpdateSubscriptionSettings(subscription.id)
  const { getBillingObjectPaymentTermCopy } = usePaymentTerm()
  const issuingBillingEntity = useBillingEntityById(subscription.billingEntityId)

  const showCustomSection = !!subscription.customer?.id
  const paymentTermLevels = { customer: subscription.customer, issuingBillingEntity }

  const { openDrawer } = useInvoicingSettingsDrawer({
    viewType: ViewTypeEnum.Subscription,
    customerId: subscription.customer?.id,
    showCustomSection,
    withInvoiceConsolidation: true,
    paymentTermInheritedFrom: getInheritedPaymentTerm(paymentTermLevels),
    onSave: saveInvoicing,
  })

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_17423672025282dl7iozy1ru')}
        description={translate('text_1782825858647mvpxt3d6et4')}
        action={{
          label: translate('text_63e51ef4985f0ebd75c212fc'),
          startIcon: 'pen',
          onClick: () =>
            openDrawer({
              consolidateInvoice: subscription.consolidateInvoice,
              invoiceCustomSection: {
                invoiceCustomSections: subscription.selectedInvoiceCustomSections ?? [],
                skipInvoiceCustomSections: subscription.skipInvoiceCustomSections ?? false,
              },
              paymentTerm: paymentTermFormValuesFromTerm(subscription.paymentTerm, true),
            }),
          hidden: !hasPermissions(['subscriptionsUpdate']),
        }}
      />

      {/* Invoice consolidation */}
      <DetailsPage.InfoGridItem
        label={translate('text_177874535109128tmqdq682k')}
        value={translate(
          subscription.consolidateInvoice
            ? 'text_1778745351091h7z5baw0ta6'
            : 'text_1778745351091fxaqr5dwok8',
        )}
      />

      {/* Payment term */}
      <DetailsPage.InfoGridItem
        label={translate('text_1778660219891rv2r5gjmklq')}
        value={getBillingObjectPaymentTermCopy({
          ownTerm: subscription.paymentTerm,
          ...paymentTermLevels,
        })}
      />

      {/* Invoice custom sections */}
      {showCustomSection && (
        <SubscriptionInvoiceCustomSectionDetails
          customerId={subscription.customer?.id}
          selectedInvoiceCustomSections={subscription.selectedInvoiceCustomSections}
          skipInvoiceCustomSections={subscription.skipInvoiceCustomSections}
        />
      )}
    </section>
  )
}
