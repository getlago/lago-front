import { useStore } from '@tanstack/react-form'

import { XeroIntegration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { connectionFieldGroupDefaultValues } from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

type XeroAccountingProviderContentProps = {
  hadInitialXeroIntegrationCustomer: boolean
  selectedXeroIntegration?: XeroIntegration
  isEdition?: boolean
}

const defaultProps: XeroAccountingProviderContentProps = {
  hadInitialXeroIntegrationCustomer: false,
  selectedXeroIntegration: undefined,
  isEdition: false,
}

const XeroAccountingProviderContent = withFieldGroup({
  defaultValues: connectionFieldGroupDefaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialXeroIntegrationCustomer,
    selectedXeroIntegration,
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
              disabled={!!syncWithProvider || hadInitialXeroIntegrationCustomer}
              label={translate('text_667d39dc1a765800d28d0604')}
              placeholder={translate('text_667d39dc1a765800d28d0605')}
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
              disabled={hadInitialXeroIntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569e', {
                connectionName: selectedXeroIntegration?.name ?? 'Xero',
              })}
            />
          )}
        </group.AppField>
      </>
    )
  },
})

export default XeroAccountingProviderContent
