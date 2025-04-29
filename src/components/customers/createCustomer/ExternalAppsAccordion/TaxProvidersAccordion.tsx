import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { Avatar } from 'lago-design-system'
import { Dispatch, FC, SetStateAction, useMemo } from 'react'

import { Accordion, Typography } from '~/components/designSystem'
import { Checkbox, ComboBox, ComboboxDataGrouped, TextInputField } from '~/components/form'
import { ADD_CUSTOMER_TAX_PROVIDER_ACCORDION } from '~/core/constants/form'
import {
  AnrokIntegration,
  AvalaraIntegration,
  CreateCustomerInput,
  IntegrationTypeEnum,
  UpdateCustomerInput,
  useGetTaxIntegrationsForExternalAppsAccordionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Anrok from '~/public/images/anrok.svg'
import Avalara from '~/public/images/avalara.svg'

import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'
import { getIntegration } from './utils'

gql`
  query getTaxIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on AnrokIntegration {
          __typename
          id
          code
          name
        }
        ... on AvalaraIntegration {
          __typename
          id
          code
          name
        }
      }
    }
  }
`

interface TaxProvidersAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  setShowTaxSection: Dispatch<SetStateAction<boolean>>
  isEdition: boolean
}

export const TaxProvidersAccordion: FC<TaxProvidersAccordionProps> = ({
  formikProps,
  setShowTaxSection,
  isEdition,
}) => {
  const { translate } = useInternationalization()

  const { data: allIntegrationsData, loading } = useGetTaxIntegrationsForExternalAppsAccordionQuery(
    { variables: { limit: 1000 } },
  )

  const {
    hadInitialIntegrationCustomer: hadInitialAnrokIntegrationCustomer,
    selectedIntegration: selectedAnrokIntegration,
    allIntegrations: allAnrokIntegrations,
    integrationPointerInIntegrationCustomer: anrokIntegrationPointerInIntegration,
    selectedIntegrationSettings: selectedAnrokIntegrationSettings,
  } = getIntegration<AnrokIntegration>({
    integrationType: IntegrationTypeEnum.Anrok,
    formikProps,
    allIntegrationsData,
  })

  const {
    hadInitialIntegrationCustomer: hadInitialAvalaraIntegrationCustomer,
    selectedIntegration: selectedAvalaraIntegration,
    allIntegrations: allAvalaraIntegrations,
    integrationPointerInIntegrationCustomer: avalaraIntegrationPointerInIntegration,
    selectedIntegrationSettings: selectedAvalaraIntegrationSettings,
  } = getIntegration<AvalaraIntegration>({
    integrationType: IntegrationTypeEnum.Avalara,
    formikProps,
    allIntegrationsData,
  })

  const allTaxIntegrationsData = useMemo(() => {
    return [...(allAnrokIntegrations || []), ...(allAvalaraIntegrations || [])]
  }, [allAnrokIntegrations, allAvalaraIntegrations])

  const connectedTaxIntegrationsData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!allTaxIntegrationsData?.length) return []

    return allTaxIntegrationsData?.map((integration) => ({
      value: integration.code,
      label: integration.name,
      group: integration?.__typename?.replace('Integration', '') || '',
      labelNode: (
        <ExternalAppsAccordionLayout.ComboboxItem
          label={integration.name}
          subLabel={integration.code}
        />
      ),
    }))
  }, [allTaxIntegrationsData])

  const selectedIntegration = selectedAnrokIntegration || selectedAvalaraIntegration
  const selectedIntegrationSettings =
    selectedAnrokIntegrationSettings || selectedAvalaraIntegrationSettings

  return (
    <div>
      <Typography variant="captionHl" color="grey700" className="mb-1">
        {translate('text_6668821d94e4da4dfd8b3840')}
      </Typography>
      <Accordion
        noContentMargin
        className={ADD_CUSTOMER_TAX_PROVIDER_ACCORDION}
        summary={
          <ExternalAppsAccordionLayout.Summary
            loading={loading}
            avatar={
              selectedIntegration && (
                <Avatar size="big" variant="connector-full">
                  {selectedIntegration?.integrationType === IntegrationTypeEnum.Anrok && <Anrok />}
                  {selectedIntegration?.integrationType === IntegrationTypeEnum.Avalara && (
                    <Avalara />
                  )}
                </Avatar>
              )
            }
            label={selectedIntegrationSettings?.name}
            subLabel={selectedIntegrationSettings?.code}
            onDelete={() => {
              formikProps.setFieldValue(
                'integrationCustomers',
                formikProps.values.integrationCustomers?.filter(
                  (i) =>
                    i.integrationType !== IntegrationTypeEnum.Anrok &&
                    i.integrationType !== IntegrationTypeEnum.Avalara,
                ),
              )
              setShowTaxSection(false)
            }}
          />
        }
      >
        <div className="flex flex-col gap-6 p-4">
          <Typography variant="bodyHl" color="grey700">
            {translate('text_65e1f90471bc198c0c934d6c')}
          </Typography>

          {/* Select connected account */}
          <ComboBox
            disabled={hadInitialAnrokIntegrationCustomer || hadInitialAvalaraIntegrationCustomer}
            data={connectedTaxIntegrationsData}
            label={translate('text_66423cad72bbad009f2f5695')}
            placeholder={translate('text_66423cad72bbad009f2f5697')}
            emptyText={translate('text_6645daa0468420011304aded')}
            PopperProps={{ displayInDialog: true }}
            value={selectedIntegration?.integrationCode as string}
            onChange={(value) => {
              const localSelectedIntegration = connectedTaxIntegrationsData.find(
                (data) => data.value === value,
              )

              if (localSelectedIntegration?.group === 'Anrok') {
                const newAnrokIntegrationObject = {
                  integrationCode: value,
                  integrationType: IntegrationTypeEnum.Anrok,
                  syncWithProvider: false,
                }

                // If no existing anrok integration, add it
                if (!selectedAnrokIntegration) {
                  formikProps.setFieldValue('integrationCustomers', [
                    ...(formikProps.values.integrationCustomers || []),
                    newAnrokIntegrationObject,
                  ])
                } else {
                  // If existing anrok integration, update it
                  formikProps.setFieldValue(
                    `${anrokIntegrationPointerInIntegration}`,
                    newAnrokIntegrationObject,
                  )
                }
              } else if (localSelectedIntegration?.group === 'Avalara') {
                const newAvalaraIntegrationObject = {
                  integrationCode: value,
                  integrationType: IntegrationTypeEnum.Avalara,
                  syncWithProvider: false,
                }

                // If no existing avalara integration, add it
                if (!selectedAvalaraIntegration) {
                  formikProps.setFieldValue('integrationCustomers', [
                    ...(formikProps.values.integrationCustomers || []),
                    newAvalaraIntegrationObject,
                  ])
                } else {
                  // If existing avalara integration, update it
                  formikProps.setFieldValue(
                    `${avalaraIntegrationPointerInIntegration}`,
                    newAvalaraIntegrationObject,
                  )
                }
              }
            }}
          />

          {!!selectedAnrokIntegration && (
            <>
              <TextInputField
                label={translate('text_66b4e77677f8c600c8d50ea3')}
                placeholder={translate('text_66b4e77677f8c600c8d50ea5')}
                name={`${anrokIntegrationPointerInIntegration}.externalCustomerId`}
                disabled={
                  !!selectedAnrokIntegration?.syncWithProvider || hadInitialAnrokIntegrationCustomer
                }
                formikProps={formikProps}
              />

              <Checkbox
                name={`${anrokIntegrationPointerInIntegration}.syncWithProvider`}
                disabled={hadInitialAnrokIntegrationCustomer}
                value={!!selectedAnrokIntegration?.syncWithProvider}
                label={translate('text_66b4e77677f8c600c8d50ea7', {
                  connectionName: selectedAnrokIntegrationSettings?.name,
                })}
                onChange={(_, checked) => {
                  const newAnrokIntegrationObject = {
                    ...selectedAnrokIntegration,
                    syncWithProvider: checked,
                  }

                  if (!isEdition && checked) {
                    newAnrokIntegrationObject.externalCustomerId = ''
                  }

                  formikProps.setFieldValue(
                    `${anrokIntegrationPointerInIntegration}`,
                    newAnrokIntegrationObject,
                  )
                }}
              />
            </>
          )}

          {!!selectedAvalaraIntegration && (
            <>
              <TextInputField
                label={translate('text_1745827156646ff5h5i281gc')}
                placeholder={translate('text_1745827156646zoyf7wmog2m')}
                name={`${avalaraIntegrationPointerInIntegration}.externalCustomerId`}
                disabled={
                  !!selectedAvalaraIntegration?.syncWithProvider ||
                  hadInitialAvalaraIntegrationCustomer
                }
                formikProps={formikProps}
              />

              <Checkbox
                name={`${avalaraIntegrationPointerInIntegration}.syncWithProvider`}
                disabled={hadInitialAvalaraIntegrationCustomer}
                value={!!selectedAvalaraIntegration?.syncWithProvider}
                label={translate('text_66423cad72bbad009f2f569e', {
                  connectionName: selectedAvalaraIntegrationSettings?.name,
                })}
                onChange={(_, checked) => {
                  const newAvalaraIntegrationObject = {
                    ...selectedAvalaraIntegration,
                    syncWithProvider: checked,
                  }

                  if (!isEdition && checked) {
                    newAvalaraIntegrationObject.externalCustomerId = ''
                  }

                  formikProps.setFieldValue(
                    `${avalaraIntegrationPointerInIntegration}`,
                    newAvalaraIntegrationObject,
                  )
                }}
              />
            </>
          )}
        </div>
      </Accordion>
    </div>
  )
}
