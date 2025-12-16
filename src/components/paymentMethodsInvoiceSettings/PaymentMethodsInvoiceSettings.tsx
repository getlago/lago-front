import { InvoceCustomFooter } from '~/components/invoceCustomFooter/InvoceCustomFooter'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { PaymentMethodSelection } from '~/components/paymentMethodSelection/PaymentMethodSelection'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { getFieldPath, getFieldValue } from '~/core/form/fieldPathUtils'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PaymentMethodsInvoiceSettingsProps, ViewTypeEnum, ViewTypeExtraPropsMap } from './types'

export const PaymentMethodsInvoiceSettings = <T extends ViewTypeEnum>({
  customer,
  formikProps,
  viewType,
  basePath,
}: PaymentMethodsInvoiceSettingsProps<T>) => {
  const { translate } = useInternationalization()

  if (!customer) return null

  const { id, externalId } = customer

  if (!id && !externalId) return null

  const extraProps: ViewTypeExtraPropsMap = {
    [ViewTypeEnum.Subscription]: {
      PaymentMethodSelection: {
        title: translate('text_17440371192353kif37ol194'),
        description: translate('text_1762862363071z59xqjpg844'),
      },
      InvoceCustomFooter: {
        title: translate('text_17628623882713knw0jtohiw'),
        description: translate('text_1762862855282gldrtploh46'),
      },
    },
    [ViewTypeEnum.WalletTopUp]: {
      PaymentMethodSelection: {
        title: translate('text_17440371192353kif37ol194'),
        description: translate('text_1762862363071z59xqjpg844'),
      },
      InvoceCustomFooter: {
        title: translate('text_17628623882713knw0jtohiw'),
        description: translate('text_1762862855282gldrtploh46'),
      },
    },
    [ViewTypeEnum.WalletRecurringTopUp]: {
      PaymentMethodSelection: {
        title: translate('text_17440371192353kif37ol194'),
        description: translate('text_1765897537099nqupfwk74wg'),
      },
      InvoceCustomFooter: {
        title: translate('text_17628623882713knw0jtohiw'),
        description: translate('text_1765897537099lgkq6xuiwdw'),
      },
    },
  }

  const currentExtraProps = extraProps[viewType]

  if (!currentExtraProps) return null

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
          {...currentExtraProps.PaymentMethodSelection}
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
          {...currentExtraProps.InvoceCustomFooter}
        />
      )}
    </>
  )
}
