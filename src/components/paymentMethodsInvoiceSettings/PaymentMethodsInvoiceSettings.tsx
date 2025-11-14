import { FormikProps } from 'formik'

import { Card, Typography } from '~/components/designSystem'
import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { PaymentMethodComboBox } from '~/components/paymentMethodComboBox/PaymentMethodComboBox'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
  formikProps: FormikProps<SubscriptionFormInput>
}

export const PaymentMethodsInvoiceSettings = ({
  customer,
  formikProps,
}: PaymentMethodsInvoiceSettingsProps) => {
  const { translate } = useInternationalization()

  if (!customer || !customer.id || !customer?.externalId) return null

  return (
    <div className="not-last-child:mb-8">
      <Typography variant="headline">{translate('text_1762862388271au34vz50g8i')}</Typography>
      <Card>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17440371192353kif37ol194')}
          </Typography>
          <Typography variant="caption" className="mb-3">
            {translate('text_1762862363071z59xqjpg844')}
          </Typography>
          <PaymentMethodComboBox
            externalCustomerId={customer.externalId}
            label={translate('text_17440371192353kif37ol194')}
            placeholder={translate('text_1762173848714al2j36a59ce')}
            emptyText={translate('text_1762173891817jhfenej7eho')}
            formikProps={formikProps}
          />
        </div>
        <InvoceCustomFooter customerId={customer.id} />
      </Card>
    </div>
  )
}
