import { useStore } from '@tanstack/react-form'

import { SalesforceIntegration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { connectionFieldGroupDefaultValues } from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

type SalesforceCrmProviderContentProps = {
  hadInitialSalesforceIntegrationCustomer: boolean
  selectedSalesforceIntegration?: SalesforceIntegration
  isEdition?: boolean
}

const defaultProps: SalesforceCrmProviderContentProps = {
  hadInitialSalesforceIntegrationCustomer: false,
  selectedSalesforceIntegration: undefined,
  isEdition: false,
}

const SalesforceCrmProviderContent = withFieldGroup({
  defaultValues: connectionFieldGroupDefaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialSalesforceIntegrationCustomer,
    selectedSalesforceIntegration,
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
              disabled={!!syncWithProvider || hadInitialSalesforceIntegrationCustomer}
              label={translate('text_1731677317443jcgfo7s0iqh')}
              placeholder={translate('text_1731677317443j3iga5orbb6')}
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
              disabled={hadInitialSalesforceIntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569e', {
                connectionName: selectedSalesforceIntegration?.name ?? 'Salesforce',
              })}
            />
          )}
        </group.AppField>
      </>
    )
  },
})

export default SalesforceCrmProviderContent
