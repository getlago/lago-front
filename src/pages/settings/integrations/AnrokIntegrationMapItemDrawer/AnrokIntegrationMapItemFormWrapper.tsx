import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { anrokMappingDefaultValues } from './validationSchema'

export const AnrokIntegrationMapItemFormWrapper = withForm({
  defaultValues: anrokMappingDefaultValues,
  props: {
    billingEntityKey: '',
  },
  render: function AnrokIntegrationMapItemFormWrapperRender({ form, billingEntityKey }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-6">
        <form.AppField name={`${billingEntityKey}.externalName`}>
          {(field) => (
            <field.TextInputField
              label={translate('text_6668821d94e4da4dfd8b38a6')}
              placeholder={translate('text_6668821d94e4da4dfd8b38be')}
            />
          )}
        </form.AppField>
        <form.AppField name={`${billingEntityKey}.externalId`}>
          {(field) => (
            <field.TextInputField
              label={translate('text_6668821d94e4da4dfd8b38d3')}
              placeholder={translate('text_6668821d94e4da4dfd8b38e7')}
            />
          )}
        </form.AppField>
      </div>
    )
  },
})
