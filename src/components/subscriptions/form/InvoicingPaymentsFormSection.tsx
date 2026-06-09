import { useStore } from '@tanstack/react-form'

import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import { ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
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
  render: function InvoicingPaymentsFormSection({ form, customer }) {
    const { translate } = useInternationalization()
    const { hasFeatureFlag } = useOrganizationInfos()

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
      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_1762862388271au34vz50g8i')}
          description={translate('text_1779198780030g64up7d4imi')}
        />
        <SubscriptionInvoiceConsolidationSection
          form={form}
          fields={{ consolidateInvoice: 'consolidateInvoice' }}
        />
        {showPaymentSettings && (
          <PaymentMethodsInvoiceSettings
            customer={customer}
            form={{
              values: { paymentMethod, invoiceCustomSection },
              setFieldValue: form.setFieldValue,
            }}
            viewType={ViewTypeEnum.Subscription}
          />
        )}
      </CenteredPage.PageSection>
    )
  },
})
