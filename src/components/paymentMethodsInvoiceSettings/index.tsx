import { Button, Card, Typography } from '~/components/designSystem'
import { PaymentMethodComboBox } from '~/components/paymentMethodComboBox'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
}

export const PaymentMethodsInvoiceSettings = ({ customer }: PaymentMethodsInvoiceSettingsProps) => {
  const { translate } = useInternationalization()

  if (!customer || !customer?.externalId) return null

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
          />
        </div>
        <div>
          <Typography variant="captionHl" color="textSecondary">
            {translate('text_17628623882713knw0jtohiw')}
          </Typography>
          <Typography variant="caption" className="mb-4">
            {translate('text_1762862855282gldrtploh46')}
          </Typography>
          <Button
            startIcon="plus"
            variant="inline"
            // eslint-disable-next-line no-console
            onClick={() => console.log(true)}
            data-test="show-name"
          >
            {translate('text_1762862908777d78m2z5d29a')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
