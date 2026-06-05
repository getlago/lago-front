import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentMethodSelection } from '~/components/paymentMethodSelection/PaymentMethodSelection'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { getFieldPath, getFieldValue } from '~/core/form/fieldPathUtils'

import { PaymentMethodsInvoiceSettingsProps, ViewTypeEnum } from './types'

export const PaymentMethodsInvoiceSettings = <T extends ViewTypeEnum>({
  customer,
  form,
  viewType,
  formFieldBasePath,
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
            form.values,
            formFieldBasePath,
          )}
          setSelectedPaymentMethod={(item) => {
            form.setFieldValue(getFieldPath('paymentMethod', formFieldBasePath), item)
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
              form.values,
              formFieldBasePath,
            ) ?? undefined
          }
          setInvoiceCustomSection={(item) => {
            form.setFieldValue(getFieldPath('invoiceCustomSection', formFieldBasePath), item)
          }}
        />
      )}
    </>
  )
}
