import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { netsuiteMappingDefaultValues } from './validationSchema'

const NetsuiteIntegrationMapItemNonTaxContextForm = withForm({
  defaultValues: netsuiteMappingDefaultValues,
  props: {
    billingEntityKey: '',
  },
  render: function NetsuiteIntegrationMapItemNonTaxContextFormRender({ form, billingEntityKey }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name={`${billingEntityKey}.externalName`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_1730738987881evzsfqnn1tr')}
              placeholder={translate('text_1730738987882hhl5gijws0m')}
            />
          )}
        </form.AppField>

        <form.AppField name={`${billingEntityKey}.externalId`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_17307389878820u8ldpctozo')}
              placeholder={translate('text_173073898788226ev6fudddk')}
            />
          )}
        </form.AppField>

        <form.AppField name={`${billingEntityKey}.externalAccountCode`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_1730738987882c15jo2dyc9f')}
              placeholder={translate('text_1730738987882h2yy21a82k2')}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export default NetsuiteIntegrationMapItemNonTaxContextForm
