import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { netsuiteMappingDefaultValues } from './validationSchema'

const NetsuiteIntegrationMapItemTaxContextForm = withForm({
  defaultValues: netsuiteMappingDefaultValues,
  props: {
    billingEntityKey: '',
  },
  render: function NetsuiteIntegrationMapItemTaxContextFormRender({ form, billingEntityKey }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name={`${billingEntityKey}.taxNexus`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_172727145621913rzc8t0twl')}
              placeholder={translate('text_17272714562195xp5rofbulp')}
            />
          )}
        </form.AppField>

        <form.AppField name={`${billingEntityKey}.taxType`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_1727271456219atwdpxysccc')}
              placeholder={translate('text_1727271456219tl2bt8qdevm')}
            />
          )}
        </form.AppField>

        <form.AppField name={`${billingEntityKey}.taxCode`}>
          {(field) => (
            <field.TextInputField
              autoComplete="off"
              label={translate('text_1727271456220dvb59po0x1g')}
              placeholder={translate('text_1727271456220u56zdq1mfrn')}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})

export default NetsuiteIntegrationMapItemTaxContextForm
