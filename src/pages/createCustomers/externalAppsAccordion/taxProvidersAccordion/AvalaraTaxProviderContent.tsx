import { useStore } from '@tanstack/react-form'

import { AvalaraIntegration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import { connectionFieldGroupDefaultValues } from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

type AvalaraTaxProviderContentProps = {
  hadInitialAvalaraIntegrationCustomer: boolean
  selectedAvalaraIntegration?: AvalaraIntegration
  isEdition?: boolean
}

const defaultProps: AvalaraTaxProviderContentProps = {
  hadInitialAvalaraIntegrationCustomer: false,
  selectedAvalaraIntegration: undefined,
  isEdition: false,
}

const AvalaraTaxProviderContent = withFieldGroup({
  defaultValues: connectionFieldGroupDefaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialAvalaraIntegrationCustomer,
    selectedAvalaraIntegration,
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
              disabled={!!syncWithProvider || hadInitialAvalaraIntegrationCustomer}
              label={translate('text_1745827156646ff5h5i281gc')}
              placeholder={translate('text_1745827156646zoyf7wmog2m')}
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
              disabled={hadInitialAvalaraIntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569e', {
                connectionName: selectedAvalaraIntegration?.name ?? 'Avalara',
              })}
            />
          )}
        </group.AppField>
      </>
    )
  },
})

export default AvalaraTaxProviderContent
