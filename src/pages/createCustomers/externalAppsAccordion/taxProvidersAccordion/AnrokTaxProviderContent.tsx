import { useStore } from '@tanstack/react-form'

import { AnrokIntegration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { connectionFieldGroupDefaultValues } from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

type AnrokTaxProviderContentProps = {
  hadInitialAnrokIntegrationCustomer: boolean
  selectedAnrokIntegration?: AnrokIntegration
  isEdition?: boolean
}

const defaultProps: AnrokTaxProviderContentProps = {
  hadInitialAnrokIntegrationCustomer: false,
  selectedAnrokIntegration: undefined,
  isEdition: false,
}

const AnrokTaxProviderContent = withFieldGroup({
  defaultValues: connectionFieldGroupDefaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialAnrokIntegrationCustomer,
    selectedAnrokIntegration,
    isEdition,
  }) {
    const { translate } = useInternationalization()

    const syncWithProvider = useStore(group.store, (state) => state.values.syncWithProvider)

    const handleSyncWithProviderChange = (value: boolean | undefined) => {
      if (!value || isEdition) return

      group.setFieldValue('externalCustomerId', '')
    }

    return (
      <>
        <group.AppField name="externalCustomerId">
          {(field) => (
            <field.TextInputField
              disabled={!!syncWithProvider || hadInitialAnrokIntegrationCustomer}
              label={translate('text_66b4e77677f8c600c8d50ea3')}
              placeholder={translate('text_66b4e77677f8c600c8d50ea5')}
            />
          )}
        </group.AppField>
        <group.AppField
          name="syncWithProvider"
          listeners={{
            onChange: ({ value }) => handleSyncWithProviderChange(value),
          }}
        >
          {(field) => (
            <field.CheckboxField
              disabled={hadInitialAnrokIntegrationCustomer}
              label={translate('text_66b4e77677f8c600c8d50ea7', {
                connectionName: selectedAnrokIntegration?.name ?? 'Anrok',
              })}
            />
          )}
        </group.AppField>
      </>
    )
  },
})

export default AnrokTaxProviderContent
