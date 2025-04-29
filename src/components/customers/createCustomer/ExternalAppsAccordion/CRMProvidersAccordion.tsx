import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { Avatar } from 'lago-design-system'
import { Dispatch, FC, SetStateAction, useMemo } from 'react'

import { Accordion, Alert, Typography } from '~/components/designSystem'
import {
  Checkbox,
  ComboBox,
  ComboboxDataGrouped,
  ComboBoxField,
  TextInputField,
} from '~/components/form'
import {
  ADD_CUSTOMER_CRM_PROVIDER_ACCORDION,
  getHubspotTargetedObjectTranslationKey,
} from '~/core/constants/form'
import {
  CreateCustomerInput,
  CustomerTypeEnum,
  HubspotIntegration,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  SalesforceIntegration,
  UpdateCustomerInput,
  useGetCrmIntegrationsForExternalAppsAccordionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Hubspot from '~/public/images/hubspot.svg'
import Salesforce from '~/public/images/salesforce.svg'

import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'
import { getIntegration } from './utils'

gql`
  query getCrmIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on HubspotIntegration {
          __typename
          id
          code
          name
          defaultTargetedObject
        }
        ... on SalesforceIntegration {
          __typename
          id
          code
          name
        }
      }
    }
  }
`

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

interface CRMProvidersAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  setShowCRMSection: Dispatch<SetStateAction<boolean>>
  isEdition: boolean
}

export const CRMProvidersAccordion: FC<CRMProvidersAccordionProps> = ({
  formikProps,
  setShowCRMSection,
  isEdition,
}) => {
  const { translate } = useInternationalization()

  const { data: allIntegrationsData, loading } = useGetCrmIntegrationsForExternalAppsAccordionQuery(
    { variables: { limit: 1000 } },
  )

  const {
    hadInitialIntegrationCustomer: hadInitialHubspotIntegrationCustomer,
    selectedIntegration: selectedHubspotIntegration,
    allIntegrations: allHubspotIntegrations,
    integrationPointerInIntegrationCustomer: hubspotIntegrationPointerInIntegrationCustomer,
    selectedIntegrationSettings: selectedHubspotIntegrationSettings,
  } = getIntegration<HubspotIntegration>({
    integrationType: IntegrationTypeEnum.Hubspot,
    formikProps,
    allIntegrationsData,
  })

  const {
    hadInitialIntegrationCustomer: hadInitialSalesforceIntegrationCustomer,
    selectedIntegration: selectedSalesforceIntegration,
    allIntegrations: allSalesforceIntegrations,
    integrationPointerInIntegrationCustomer: salesforceIntegrationPointerInIntegrationCustomer,
    selectedIntegrationSettings: selectedSalesforceIntegrationSettings,
  } = getIntegration<SalesforceIntegration>({
    integrationType: IntegrationTypeEnum.Salesforce,
    formikProps,
    allIntegrationsData,
  })

  const selectedIntegration = selectedHubspotIntegration || selectedSalesforceIntegration
  const selectedIntegrationSettings =
    selectedHubspotIntegrationSettings || selectedSalesforceIntegrationSettings

  const allCRMIntegrationsData = useMemo(() => {
    return [...(allHubspotIntegrations || []), ...(allSalesforceIntegrations || [])]
  }, [allHubspotIntegrations, allSalesforceIntegrations])

  const connectedCRMIntegrationsData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!allCRMIntegrationsData?.length) return []

    return allCRMIntegrationsData?.map((integration) => ({
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
  }, [allCRMIntegrationsData])

  return (
    <div>
      <Typography variant="captionHl" color="grey700" className="mb-1">
        {translate('text_1728658962985xpfdvl5ru8a')}
      </Typography>
      <Accordion
        noContentMargin
        className={ADD_CUSTOMER_CRM_PROVIDER_ACCORDION}
        summary={
          <ExternalAppsAccordionLayout.Summary
            loading={loading}
            avatar={
              selectedIntegration && (
                <Avatar size="big" variant="connector-full">
                  {selectedIntegration.integrationType === IntegrationTypeEnum.Hubspot && (
                    <Hubspot />
                  )}
                  {selectedIntegration.integrationType === IntegrationTypeEnum.Salesforce && (
                    <Salesforce />
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
                    i.integrationType !== IntegrationTypeEnum.Hubspot &&
                    i.integrationType !== IntegrationTypeEnum.Salesforce,
                ),
              )
              setShowCRMSection(false)
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
            disabled={
              hadInitialHubspotIntegrationCustomer || hadInitialSalesforceIntegrationCustomer
            }
            data={connectedCRMIntegrationsData}
            label={translate('text_66423cad72bbad009f2f5695')}
            placeholder={translate('text_66423cad72bbad009f2f5697')}
            emptyText={translate('text_6645daa0468420011304aded')}
            PopperProps={{ displayInDialog: true }}
            value={
              selectedHubspotIntegration
                ? (selectedHubspotIntegration.integrationCode as string)
                : selectedSalesforceIntegration
                  ? (selectedSalesforceIntegration.integrationCode as string)
                  : undefined
            }
            onChange={(value) => {
              const localSelectedIntegration = connectedCRMIntegrationsData.find(
                (data) => data.value === value,
              )

              if (localSelectedIntegration?.group === 'Hubspot') {
                let localDefaultTargetedObject

                if (formikProps.values.customerType === CustomerTypeEnum.Company) {
                  localDefaultTargetedObject = HubspotTargetedObjectsEnum.Companies
                } else if (formikProps.values.customerType === CustomerTypeEnum.Individual) {
                  localDefaultTargetedObject = HubspotTargetedObjectsEnum.Contacts
                } else {
                  const { defaultTargetedObject } = allHubspotIntegrations?.find(
                    (i) => i.code === value,
                  ) as HubspotIntegration

                  localDefaultTargetedObject = defaultTargetedObject
                }

                const newHubspotIntegrationObject = {
                  integrationCode: value,
                  integrationType: IntegrationTypeEnum.Hubspot,
                  syncWithProvider: false,
                  targetedObject: localDefaultTargetedObject,
                }

                // If no existing hubspot integration, add it
                if (!selectedHubspotIntegration) {
                  formikProps.setFieldValue('integrationCustomers', [
                    ...(formikProps.values.integrationCustomers || []),
                    newHubspotIntegrationObject,
                  ])
                } else {
                  // If existing hubspot integration, update it
                  formikProps.setFieldValue(
                    `${hubspotIntegrationPointerInIntegrationCustomer}`,
                    newHubspotIntegrationObject,
                  )
                }
              } else if (localSelectedIntegration?.group === 'Salesforce') {
                const newSalesforceIntegrationObject = {
                  integrationCode: value,
                  integrationType: IntegrationTypeEnum.Salesforce,
                  syncWithProvider: false,
                }

                // If no existing salesforce integration, add it
                if (!selectedSalesforceIntegration) {
                  formikProps.setFieldValue('integrationCustomers', [
                    ...(formikProps.values.integrationCustomers || []),
                    newSalesforceIntegrationObject,
                  ])
                } else {
                  // If existing salesforce integration, update it
                  formikProps.setFieldValue(
                    `${salesforceIntegrationPointerInIntegrationCustomer}`,
                    newSalesforceIntegrationObject,
                  )
                }
              }
            }}
          />

          {!!selectedHubspotIntegration && (
            <>
              <ComboBoxField
                disableClearable
                label={translate('text_17290677918809xyyuizjvtk')}
                name={`${hubspotIntegrationPointerInIntegrationCustomer}.targetedObject`}
                disabled={hadInitialHubspotIntegrationCustomer}
                data={[
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
                ]}
                PopperProps={{ displayInDialog: true }}
                formikProps={formikProps}
              />

              {!!selectedHubspotIntegration.targetedObject && (
                <>
                  <TextInputField
                    label={translate(
                      hubspotExternalIdTypeCopyMap[selectedHubspotIntegration.targetedObject][
                        'label'
                      ],
                    )}
                    placeholder={translate(
                      hubspotExternalIdTypeCopyMap[selectedHubspotIntegration.targetedObject][
                        'placeholder'
                      ],
                    )}
                    name={`${hubspotIntegrationPointerInIntegrationCustomer}.externalCustomerId`}
                    disabled={
                      !!selectedHubspotIntegration?.syncWithProvider ||
                      hadInitialHubspotIntegrationCustomer
                    }
                    formikProps={formikProps}
                  />

                  <Checkbox
                    name={`${hubspotIntegrationPointerInIntegrationCustomer}.syncWithProvider`}
                    disabled={hadInitialHubspotIntegrationCustomer}
                    value={!!selectedHubspotIntegration?.syncWithProvider}
                    label={translate('text_66423cad72bbad009f2f569e', {
                      connectionName: selectedHubspotIntegrationSettings?.name,
                    })}
                    onChange={(_, checked) => {
                      const newHubspotIntegrationObject = {
                        ...selectedHubspotIntegration,
                        syncWithProvider: checked,
                      }

                      if (!isEdition && checked) {
                        newHubspotIntegrationObject.externalCustomerId = ''
                      }

                      formikProps.setFieldValue(
                        `${hubspotIntegrationPointerInIntegrationCustomer}`,
                        newHubspotIntegrationObject,
                      )
                    }}
                  />
                </>
              )}
            </>
          )}

          {!!selectedSalesforceIntegration && (
            <>
              <TextInputField
                label={translate('text_1731677317443jcgfo7s0iqh')}
                placeholder={translate('text_1731677317443j3iga5orbb6')}
                name={`${salesforceIntegrationPointerInIntegrationCustomer}.externalCustomerId`}
                disabled={
                  !!selectedSalesforceIntegration.syncWithProvider ||
                  hadInitialSalesforceIntegrationCustomer
                }
                formikProps={formikProps}
              />
              <Checkbox
                name={`${salesforceIntegrationPointerInIntegrationCustomer}.syncWithProvider`}
                disabled={hadInitialSalesforceIntegrationCustomer}
                value={!!selectedSalesforceIntegration.syncWithProvider}
                label={translate('text_66423cad72bbad009f2f569e', {
                  connectionName: selectedSalesforceIntegrationSettings?.name,
                })}
                onChange={(_, checked) => {
                  const newSalesforceIntegrationObject = {
                    ...selectedSalesforceIntegration,
                    syncWithProvider: checked,
                  }

                  if (!isEdition && checked) {
                    newSalesforceIntegrationObject.externalCustomerId = ''
                  }

                  formikProps.setFieldValue(
                    `${salesforceIntegrationPointerInIntegrationCustomer}`,
                    newSalesforceIntegrationObject,
                  )
                }}
              />
            </>
          )}

          {isEdition &&
            !!selectedHubspotIntegration?.syncWithProvider &&
            !hadInitialHubspotIntegrationCustomer && (
              <Alert type="info">{translate('text_1729067791880abj1lzd7dn9')}</Alert>
            )}
        </div>
      </Accordion>
    </div>
  )
}
