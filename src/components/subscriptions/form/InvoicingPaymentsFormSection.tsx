import { useStore } from '@tanstack/react-form'

import { InvoiceCustomSectionFields } from '~/components/invoceCustomFooter/InvoiceCustomSectionFields'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodFields } from '~/components/paymentMethodSelection/PaymentMethodFields'
import {
  VIEW_TYPE_TRANSLATION_KEYS,
  ViewTypeEnum,
} from '~/components/paymentMethodsInvoiceSettings/types'
import { SubscriptionInvoiceConsolidationSection } from '~/components/subscriptions/SubscriptionInvoiceConsolidationSection'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { Customer, FeatureFlagEnum, Maybe } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { buildSubscriptionDefaultValues } from './buildSubscriptionDefaultValues'

type CustomerForPayments = Maybe<Partial<Pick<Customer, 'id' | 'externalId'>>>

interface InvoicingPaymentsFormSectionExtraProps {
  customer: CustomerForPayments
}

const invoicingPaymentsDefaultProps: InvoicingPaymentsFormSectionExtraProps = {
  customer: null,
}

const TYPING_PLACEHOLDER_DATE = '2026-01-01'

export const InvoicingPaymentsFormSection = withForm({
  defaultValues: buildSubscriptionDefaultValues(
    undefined,
    FORM_TYPE_ENUM.creation,
    TYPING_PLACEHOLDER_DATE,
  ),
  props: invoicingPaymentsDefaultProps,
  render: function InvoicingPaymentsFormSectionRender({ form, customer }) {
    const { translate } = useInternationalization()
    const { hasFeatureFlag } = useOrganizationInfos()
    const viewTypeLabel = translate(VIEW_TYPE_TRANSLATION_KEYS[ViewTypeEnum.Subscription])

    // Reactive store slices - never the non-reactive `form.state.values`
    // snapshot, or dialog edits won't re-render the displayed selection.
    const paymentMethod = useStore(form.store, (s) => s.values.paymentMethod)
    const invoiceCustomSection = useStore(form.store, (s) => s.values.invoiceCustomSection)

    // Consolidation is available to every org; only the payment settings need
    // the flag and a resolved customer (mirrors v1 CreateSubscription).
    const showPaymentSettings =
      hasFeatureFlag(FeatureFlagEnum.MultiplePaymentMethods) &&
      Boolean(customer?.externalId || customer?.id)

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate('text_1762862388271au34vz50g8i')}
          description={translate('text_1779198780030g64up7d4imi')}
        />

        <CenteredPage.SubsectionWrapper>
          <CenteredPage.PageSection>
            <CenteredPage.PageSectionTitle
              title={translate('text_177874535109128tmqdq682k')}
              description={translate('text_17827386443477iuks0kxmx5')}
            />
            <SubscriptionInvoiceConsolidationSection
              form={form}
              fields={{ consolidateInvoice: 'consolidateInvoice' }}
            />
          </CenteredPage.PageSection>

          {showPaymentSettings && (
            <>
              {customer?.externalId && (
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_17440371192353kif37ol194')}
                    description={translate('text_1782804838056cnj8mzoxrd3')}
                  />
                  <PaymentMethodFields
                    viewType={ViewTypeEnum.Subscription}
                    externalCustomerId={customer.externalId}
                    value={paymentMethod}
                    onChange={(value) => form.setFieldValue('paymentMethod', value)}
                  />
                </CenteredPage.PageSection>
              )}
              {customer?.id && (
                <CenteredPage.PageSection>
                  <CenteredPage.PageSectionTitle
                    title={translate('text_1749024634192ov41w9fp6r2')}
                    description={translate('text_1782738644347o1c2bvdta8j', {
                      object: viewTypeLabel,
                    })}
                  />
                  <InvoiceCustomSectionFields
                    viewType={ViewTypeEnum.Subscription}
                    customerId={customer.id}
                    value={invoiceCustomSection}
                    onChange={(value) => form.setFieldValue('invoiceCustomSection', value)}
                  />
                </CenteredPage.PageSection>
              )}
            </>
          )}
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})
