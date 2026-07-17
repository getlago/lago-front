import { useStore } from '@tanstack/react-form'

import { getHubspotTargetedObjectTranslationKey } from '~/core/constants/form'
import { HubspotIntegration, HubspotTargetedObjectsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'
import {
  connectionFieldGroupDefaultValues,
  ConnectionFieldGroupValues,
} from '~/pages/createCustomers/externalAppsAccordion/common/connectionFieldGroup'

type HubspotCrmProviderContentProps = {
  hadInitialHubspotIntegrationCustomer: boolean
  selectedHubspotIntegration?: HubspotIntegration
  isEdition?: boolean
}

const defaultProps: HubspotCrmProviderContentProps = {
  hadInitialHubspotIntegrationCustomer: false,
  selectedHubspotIntegration: undefined,
  isEdition: false,
}

type HubspotConnectionValues = ConnectionFieldGroupValues & {
  targetedObject: HubspotTargetedObjectsEnum | undefined
}

const defaultValues: HubspotConnectionValues = {
  ...connectionFieldGroupDefaultValues,
  targetedObject: undefined,
}

const hubspotExternalIdTypeCopyMap: Record<
  HubspotTargetedObjectsEnum,
  Record<'label' | 'placeholder', string>
> = {
  [HubspotTargetedObjectsEnum.Companies]: {
    label: 'text_1729602057769exfgebgaj4g',
    placeholder: 'text_1729602057769w37ljj318sn',
  },
  [HubspotTargetedObjectsEnum.Contacts]: {
    label: 'text_1729067791880uwec7af9cpq',
    placeholder: 'text_1729067791880y0th6mtz2av',
  },
}

const HubspotCrmProviderContent = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({
    group,
    hadInitialHubspotIntegrationCustomer,
    selectedHubspotIntegration,
    isEdition,
  }) {
    const { translate } = useInternationalization()

    const syncWithProvider = useStore(group.store, (state) => state.values.syncWithProvider)

    const targetedObject = useStore(group.store, (state) => state.values.targetedObject)

    const targetedObjectdata = [
      {
        label: translate(
          getHubspotTargetedObjectTranslationKey[HubspotTargetedObjectsEnum.Companies],
        ),
        value: HubspotTargetedObjectsEnum.Companies,
      },
      {
        label: translate(
          getHubspotTargetedObjectTranslationKey[HubspotTargetedObjectsEnum.Contacts],
        ),
        value: HubspotTargetedObjectsEnum.Contacts,
      },
    ]

    const handleSyncWithProviderChange = (value: boolean | undefined) => {
      if (!value || isEdition) return

      group.setFieldValue('externalCustomerId', '')
    }

    return (
      <>
        <group.AppField name="targetedObject">
          {(field) => (
            <field.ComboBoxField
              disableClearable
              label={translate('text_17290677918809xyyuizjvtk')}
              disabled={hadInitialHubspotIntegrationCustomer}
              data={targetedObjectdata}
              PopperProps={{ displayInDialog: true }}
            />
          )}
        </group.AppField>
        {!!targetedObject && (
          <>
            <group.AppField name="externalCustomerId">
              {(field) => (
                <field.TextInputField
                  disabled={!!syncWithProvider || hadInitialHubspotIntegrationCustomer}
                  label={translate(hubspotExternalIdTypeCopyMap[targetedObject]['label'])}
                  placeholder={translate(
                    hubspotExternalIdTypeCopyMap[targetedObject]['placeholder'],
                  )}
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
                  disabled={hadInitialHubspotIntegrationCustomer}
                  label={translate('text_66423cad72bbad009f2f569e', {
                    connectionName: selectedHubspotIntegration?.name || 'Hubspot',
                  })}
                />
              )}
            </group.AppField>
          </>
        )}
      </>
    )
  },
})

export default HubspotCrmProviderContent
