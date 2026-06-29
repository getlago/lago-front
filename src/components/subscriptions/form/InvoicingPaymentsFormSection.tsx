import { useStore } from '@tanstack/react-form'
import { useState } from 'react'

import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import { ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import { PO } from '~/components/purchaseOrder/PO'
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
    const [isPurchaseOrderNumberFieldVisible, setIsPurchaseOrderNumberFieldVisible] = useState(
      () => !!form.state.values.purchaseOrderNumber,
    )

    // Reactive store slices - never the non-reactive `form.state.values`
    // snapshot, or dialog edits won't re-render the displayed selection.
    const paymentMethod = useStore(form.store, (s) => s.values.paymentMethod)
    const invoiceCustomSection = useStore(form.store, (s) => s.values.invoiceCustomSection)
    const purchaseOrderNumber = useStore(form.store, (s) => s.values.purchaseOrderNumber)

    // Consolidation is available to every org; only the payment settings need
    // the flag and a resolved customer (mirrors v1 CreateSubscription).
    const showPaymentSettings =
      hasFeatureFlag(FeatureFlagEnum.MultiplePaymentMethods) &&
      Boolean(customer?.externalId || customer?.id)
    const shouldShowPurchaseOrderNumberField =
      isPurchaseOrderNumberFieldVisible || !!purchaseOrderNumber

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
        <PO
          value={purchaseOrderNumber}
          onChange={(value) => form.setFieldValue('purchaseOrderNumber', value)}
          description={translate('text_1782219771287jpjz8hd1kil')}
        >
          <div className="flex flex-col gap-1">
            <PO.Title />
            <PO.Description />
          </div>
          {shouldShowPurchaseOrderNumberField ? (
            <div className="flex items-start gap-3">
              <form.AppField name="purchaseOrderNumber">
                {(field) => (
                  <field.TextInputField
                    className="min-w-0 flex-1"
                    placeholder={translate('text_17822197712869ou05y6kwt7')}
                  />
                )}
              </form.AppField>
              <PO.TrashButton
                className="mt-1"
                onClick={() => {
                  form.setFieldValue('purchaseOrderNumber', null)
                  setIsPurchaseOrderNumberFieldVisible(false)
                }}
              />
            </div>
          ) : (
            <PO.AddButton onClick={() => setIsPurchaseOrderNumberFieldVisible(true)} />
          )}
        </PO>
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
