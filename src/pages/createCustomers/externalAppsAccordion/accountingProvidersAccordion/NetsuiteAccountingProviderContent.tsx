import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { ConnectionComboBoxLabel } from '~/components/customerConnections/ConnectionComboBox'
import { Alert } from '~/components/designSystem/Alert'
import { BasicComboBoxData } from '~/components/form'
import { NetsuiteIntegration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import {
  connectionFieldGroupDefaultValues,
  ConnectionFieldGroupValues,
} from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

import { useAccountingProvidersSubsidaries } from './useAccountingProvidersSubsidaries'

type NetsuiteAccountingProviderContentProps = {
  hadInitialNetsuiteIntegrationCustomer: boolean
  selectedNetsuiteIntegration?: NetsuiteIntegration
  isEdition?: boolean
}

const defaultProps: NetsuiteAccountingProviderContentProps = {
  hadInitialNetsuiteIntegrationCustomer: false,
  selectedNetsuiteIntegration: undefined,
  isEdition: false,
}

type NetsuiteConnectionValues = ConnectionFieldGroupValues & {
  subsidiaryId: string | undefined
}

const defaultValues: NetsuiteConnectionValues = {
  ...connectionFieldGroupDefaultValues,
  subsidiaryId: '',
}

const NetsuiteAccountingProviderContent = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialNetsuiteIntegrationCustomer,
    selectedNetsuiteIntegration,
    isEdition,
  }) {
    const { translate } = useInternationalization()

    const { subsidiariesData } = useAccountingProvidersSubsidaries(selectedNetsuiteIntegration?.id)

    const syncWithProvider = useStore(group.store, (state) => state.values.syncWithProvider)

    const connectedIntegrationSubsidiaries: BasicComboBoxData[] | [] = useMemo(() => {
      if (!subsidiariesData?.integrationSubsidiaries?.collection.length) return []

      return subsidiariesData?.integrationSubsidiaries?.collection.map((integrationSubsidiary) => ({
        value: integrationSubsidiary.externalId,
        label: `${integrationSubsidiary.externalName} (${integrationSubsidiary.externalId})`,
        labelNode: (
          <ConnectionComboBoxLabel
            label={integrationSubsidiary.externalName ?? ''}
            subLabel={integrationSubsidiary.externalId}
          />
        ),
      }))
    }, [subsidiariesData?.integrationSubsidiaries?.collection])

    const handleSyncWithProviderChange = (value: boolean | undefined) => {
      if (!value || isEdition) return

      group.setFieldValue('externalCustomerId', '')
    }

    return (
      <>
        <group.AppField name="externalCustomerId">
          {(field) => (
            <field.TextInputField
              disabled={!!syncWithProvider || hadInitialNetsuiteIntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569a')}
              placeholder={translate('text_66423cad72bbad009f2f569c')}
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
              disabled={hadInitialNetsuiteIntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569e', {
                connectionName: selectedNetsuiteIntegration?.name ?? 'NetSuite',
              })}
            />
          )}
        </group.AppField>

        {!!syncWithProvider && (
          <group.AppField name="subsidiaryId">
            {(field) => (
              <field.ComboBoxField
                data={connectedIntegrationSubsidiaries}
                disabled={hadInitialNetsuiteIntegrationCustomer}
                label={translate('text_66423cad72bbad009f2f56a0')}
                placeholder={translate('text_66423cad72bbad009f2f56a2')}
                PopperProps={{ displayInDialog: true }}
              />
            )}
          </group.AppField>
        )}
        {syncWithProvider && isEdition && !hadInitialNetsuiteIntegrationCustomer && (
          <Alert type="info">{translate('text_66423cad72bbad009f2f56a4')}</Alert>
        )}
      </>
    )
  },
})

export default NetsuiteAccountingProviderContent
