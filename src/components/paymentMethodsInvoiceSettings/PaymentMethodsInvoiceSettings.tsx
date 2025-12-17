import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentMethodSelection } from '~/components/paymentMethodSelection/PaymentMethodSelection'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { getFieldPath, getFieldValue } from '~/core/form/fieldPathUtils'

import { PaymentMethodsInvoiceSettingsProps, ViewTypeEnum } from './types'

export const PaymentMethodsInvoiceSettings = <T extends ViewTypeEnum>({
  customer,
  formikProps,
  viewType,
  basePath,
}: PaymentMethodsInvoiceSettingsProps<T>) => {
  if (!customer) return null

  const { id, externalId } = customer

  if (!id && !externalId) return null

  return (
    <>
      {externalId && (
        <PaymentMethodSelection
          viewType={viewType}
          externalCustomerId={externalId}
          selectedPaymentMethod={getFieldValue<SelectedPaymentMethod>(
            'paymentMethod',
            formikProps.values,
            basePath,
          )}
          setSelectedPaymentMethod={(item) => {
            formikProps.setFieldValue(getFieldPath('paymentMethod', basePath), item)
          }}
        />
      )}
      {id && (
        <InvoceCustomFooter
          customerId={id}
          viewType={viewType}
          invoiceCustomSection={
            getFieldValue<InvoiceCustomSectionInput>(
              'invoiceCustomSection',
              formikProps.values,
              basePath,
            ) ?? undefined
          }
          setInvoiceCustomSection={(item) => {
            formikProps.setFieldValue(getFieldPath('invoiceCustomSection', basePath), item)
          }}
        />
      )}
    </>
  )
}
