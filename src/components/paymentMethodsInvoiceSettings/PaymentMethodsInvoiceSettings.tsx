import { Card } from '~/components/designSystem'
import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { PaymentMethodSelection } from '~/components/paymentMethodSelection/PaymentMethodSelection'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PaymentMethodsInvoiceSettingsProps, ViewTypeExtraPropsMap } from './types'

export const PaymentMethodsInvoiceSettings = ({
  customer,
  formikProps,
  viewType,
}: PaymentMethodsInvoiceSettingsProps) => {
  const { translate } = useInternationalization()

  if (!customer) return null

  const { id, externalId } = customer

  if (!id && !externalId) return null

  const extraProps: ViewTypeExtraPropsMap = {
    subscription: {
      PaymentMethodSelection: {
        title: translate('text_17440371192353kif37ol194'),
        description: translate('text_1762862363071z59xqjpg844'),
      },
      InvoceCustomFooter: {
        title: translate('text_17628623882713knw0jtohiw'),
        description: translate('text_1762862855282gldrtploh46'),
      },
    },
  }

  const currentExtraProps = extraProps[viewType]

  if (!currentExtraProps) return null

  return (
    <Card>
      {externalId && (
        <PaymentMethodSelection
          viewType={viewType}
          externalCustomerId={externalId}
          selectedPaymentMethod={formikProps.values?.paymentMethod}
          setSelectedPaymentMethod={(item) => {
            formikProps.setFieldValue('paymentMethod', item)
          }}
          {...currentExtraProps.PaymentMethodSelection}
        />
      )}
      {id && <InvoceCustomFooter customerId={id} {...currentExtraProps.InvoceCustomFooter} />}
    </Card>
  )
}
