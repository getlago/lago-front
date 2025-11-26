import { FormikProps } from 'formik'

import { Card } from '~/components/designSystem'
import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { PaymentMethodComboBox } from '~/components/paymentMethodComboBox/PaymentMethodComboBox'
import { GetCustomerForCreateSubscriptionQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'

import { ViewTypeExtraPropsMap } from './types'

interface PaymentMethodsInvoiceSettingsProps {
  customer: GetCustomerForCreateSubscriptionQuery['customer']
  formikProps: FormikProps<SubscriptionFormInput>
  viewType: 'subscription'
}

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
      PaymentMethodComboBox: {
        sectionName: translate('text_17641654835679kfg1k3bike'),
        title: translate('text_17440371192353kif37ol194'),
        description: translate('text_1762862363071z59xqjpg844'),
      },
      InvoceCustomFooter: {
        sectionName: translate('text_17641654835679kfg1k3bike'),
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
        <PaymentMethodComboBox
          externalCustomerId={externalId}
          selectedPaymentMethod={formikProps.values?.paymentMethod}
          setSelectedPaymentMethod={(item) => {
            formikProps.setFieldValue('paymentMethod', item)
          }}
          {...currentExtraProps.PaymentMethodComboBox}
        />
      )}
      {id && <InvoceCustomFooter customerId={id} {...currentExtraProps.InvoceCustomFooter} />}
    </Card>
  )
}
