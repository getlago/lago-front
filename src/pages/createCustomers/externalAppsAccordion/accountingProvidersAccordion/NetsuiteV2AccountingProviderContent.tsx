import { useStore } from '@tanstack/react-form'
import { useMemo } from 'react'

import { Alert } from '~/components/designSystem'
import { BasicComboBoxData } from '~/components/form'
import { NetsuiteV2Integration } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { ExternalAppsAccordionLayout } from '~/pages/createCustomers/externalAppsAccordion/common/ExternalAppsAccordionLayout'
import { emptyCreateCustomerDefaultValues } from '~/pages/createCustomers/formInitialization/validationSchema'

import { useAccountingProvidersSubsidaries } from './useAccountingProvidersSubsidaries'

type NetsuiteV2AccountingProviderContentProps = {
  hadInitialNetsuiteV2IntegrationCustomer: boolean
  selectedNetsuiteV2Integration?: NetsuiteV2Integration
  isEdition?: boolean
}

const defaultProps: NetsuiteV2AccountingProviderContentProps = {
  hadInitialNetsuiteV2IntegrationCustomer: false,
  selectedNetsuiteV2Integration: undefined,
  isEdition: false,
}

const NetsuiteV2AccountingProviderContent = withForm({
  defaultValues: emptyCreateCustomerDefaultValues,
  props: defaultProps,
  render: function Render({
    form,
    hadInitialNetsuiteV2IntegrationCustomer,
    selectedNetsuiteV2Integration,
    isEdition,
  }) {
    const { translate } = useInternationalization()

    const { subsidiariesData } = useAccountingProvidersSubsidaries(selectedNetsuiteV2Integration?.id)

    const syncWithProvider = useStore(
      form.store,
      (state) => state.values.accountingCustomer?.syncWithProvider,
    )

    const connectedIntegrationSubsidiaries: BasicComboBoxData[] | [] = useMemo(() => {
      if (!subsidiariesData?.integrationSubsidiaries?.collection.length) return []

      return subsidiariesData?.integrationSubsidiaries?.collection.map((integrationSubsidiary) => ({
        value: integrationSubsidiary.externalId,
        label: `${integrationSubsidiary.externalName} (${integrationSubsidiary.externalId})`,
        labelNode: (
          <ExternalAppsAccordionLayout.ComboboxItem
            label={integrationSubsidiary.externalName ?? ''}
            subLabel={integrationSubsidiary.externalId}
          />
        ),
      }))
    }, [subsidiariesData?.integrationSubsidiaries?.collection])

    const handleSyncWithProviderChange = (value: boolean | undefined) => {
      if (!value || isEdition) return

      form.setFieldValue('accountingCustomer.accountingCustomerId', '')
    }

    return (
      <>
        <form.AppField name="accountingCustomer.accountingCustomerId">
          {(field) => (
            <field.TextInputField
              disabled={!!syncWithProvider || hadInitialNetsuiteV2IntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569a')}
              placeholder={translate('text_66423cad72bbad009f2f569c')}
            />
          )}
        </form.AppField>
        <form.AppField
          name="accountingCustomer.syncWithProvider"
          listeners={{
            onChange: ({ value }) => handleSyncWithProviderChange(value),
          }}
        >
          {(field) => (
            <field.CheckboxField
              disabled={hadInitialNetsuiteV2IntegrationCustomer}
              label={translate('text_66423cad72bbad009f2f569e', {
                connectionName: selectedNetsuiteV2Integration?.name ?? 'NetSuite',
              })}
            />
          )}
        </form.AppField>

        {!!syncWithProvider && (
          <form.AppField name="accountingCustomer.subsidiaryId">
            {(field) => (
              <field.ComboBoxField
                data={connectedIntegrationSubsidiaries}
                disabled={hadInitialNetsuiteV2IntegrationCustomer}
                label={translate('text_66423cad72bbad009f2f56a0')}
                placeholder={translate('text_66423cad72bbad009f2f56a2')}
                PopperProps={{ displayInDialog: true }}
              />
            )}
          </form.AppField>
        )}
        {syncWithProvider && isEdition && !hadInitialNetsuiteV2IntegrationCustomer && (
          <Alert type="info">{translate('text_66423cad72bbad009f2f56a4')}</Alert>
        )}
      </>
    )
  },
})

export default NetsuiteV2AccountingProviderContent
