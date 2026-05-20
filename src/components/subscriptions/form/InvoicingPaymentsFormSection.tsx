import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentMethodsInvoiceSettings } from '~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings'
import {
  PaymentMethodsInvoiceSettingsProps,
  ViewTypeEnum,
} from '~/components/paymentMethodsInvoiceSettings/types'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import { Customer, Maybe } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

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

    if (!customer?.externalId && !customer?.id) return null

    return (
      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_1762862388271au34vz50g8i')}
          description={translate('text_1779198780030g64up7d4imi')}
        />
        <PaymentMethodsInvoiceSettings
          customer={customer}
          formikProps={
            {
              values: form.state.values,
              setFieldValue: form.setFieldValue,
            } as PaymentMethodsInvoiceSettingsProps<ViewTypeEnum.Subscription>['formikProps']
          }
          viewType={ViewTypeEnum.Subscription}
        />
      </CenteredPage.PageSection>
    )
  },
})
