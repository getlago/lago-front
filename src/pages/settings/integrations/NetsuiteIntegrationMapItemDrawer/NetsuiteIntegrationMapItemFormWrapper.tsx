import { withForm } from '~/hooks/forms/useAppform'

import NetsuiteIntegrationMapItemNonTaxContextForm from './NetsuiteIntegrationMapItemNonTaxContextForm'
import NetsuiteIntegrationMapItemTaxContextForm from './NetsuiteIntegrationMapItemTaxContextForm'
import { netsuiteMappingDefaultValues } from './validationSchema'

export const NetsuiteIntegrationMapItemFormWrapper = withForm({
  defaultValues: netsuiteMappingDefaultValues,
  props: {
    billingEntityKey: '',
    isTaxContext: false,
  },
  render: function NetsuiteIntegrationMapItemFormWrapperRender({
    form,
    billingEntityKey,
    isTaxContext,
  }) {
    if (isTaxContext) {
      return (
        <NetsuiteIntegrationMapItemTaxContextForm form={form} billingEntityKey={billingEntityKey} />
      )
    }

    return (
      <NetsuiteIntegrationMapItemNonTaxContextForm
        form={form}
        billingEntityKey={billingEntityKey}
      />
    )
  },
})
