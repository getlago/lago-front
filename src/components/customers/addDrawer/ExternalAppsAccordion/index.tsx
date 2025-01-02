import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Alert, Avatar, Button, Popper, Typography } from '~/components/designSystem'
import {
  Checkbox,
  ComboBox,
  ComboboxDataGrouped,
  ComboBoxField,
  TextInputField,
} from '~/components/form'
import {
  ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION,
  ADD_CUSTOMER_CRM_PROVIDER_ACCORDION,
  ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION,
  ADD_CUSTOMER_TAX_PROVIDER_ACCORDION,
  getHubspotTargetedObjectTranslationKey,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import {
  CreateCustomerInput,
  CustomerTypeEnum,
  HubspotIntegration,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  ProviderTypeEnum,
  SalesforceIntegration,
  UpdateCustomerInput,
  useGetIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Hubspot from '~/public/images/hubspot.svg'
import PSPIcons from '~/public/images/psp-icons.svg'
import Salesforce from '~/public/images/salesforce.svg'
import { MenuPopper, theme } from '~/styles'

import { AccountingProvidersAccordion } from './AccountingProvidersAccordion'
import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'
import { PaymentProvidersAccordion } from './PaymentProvidersAccordion'
import { TaxProvidersAccordion } from './TaxProvidersAccordion'

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

gql`
  fragment CustomerForExternalAppsAccordion on Customer {
    id
    customerType
    # Name in the customer is netsuiteCustomer, but it's used as integrationCustomer in the create update inputs
    netsuiteCustomer {
      externalCustomerId
      integrationCode
      integrationType
      subsidiaryId
      syncWithProvider
    }
    anrokCustomer {
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    xeroCustomer {
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    hubspotCustomer {
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
    salesforceCustomer {
      externalCustomerId
      integrationCode
      integrationType
      syncWithProvider
    }
  }

  query getIntegrationsListForCustomerEditExternalAppsAccordion($limit: Int, $page: Int) {
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

type TExternalAppsAccordionProps = {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  isEdition: boolean
}

export const ExternalAppsAccordion = ({ formikProps, isEdition }: TExternalAppsAccordionProps) => {
  const { translate } = useInternationalization()

  const [getIntegrationsData, { data: allIntegrationsData }] =
    useGetIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000 },
    })

  const allHubspotIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'HubspotIntegration',
  ) as HubspotIntegration[] | undefined

  const allSalesforceIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'SalesforceIntegration',
  ) as SalesforceIntegration[] | undefined

  const selectedHubspotIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Hubspot,
    ) || 0
  const selectedSalesforceIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Salesforce,
    ) || 0

  const hubspotIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedHubspotIntegrationIndex}`
  const salesforceIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedSalesforceIntegrationIndex}`

  const selectedHubspotIntegration =
    formikProps.values.integrationCustomers?.[selectedHubspotIntegrationIndex]
  const selectedSalesforceIntegration =
    formikProps.values.integrationCustomers?.[selectedSalesforceIntegrationIndex]

  const selectedHubspotIntegrationSettings = allHubspotIntegrations?.find(
    (i) => i.code === selectedHubspotIntegration?.integrationCode,
  ) as HubspotIntegration

  const selectedSalesforceIntegrationSettings = allSalesforceIntegrations?.find(
    (i) => i.code === selectedSalesforceIntegration?.integrationCode,
  ) as SalesforceIntegration

  const allCRMIntegrationsData = useMemo(() => {
    return [...(allHubspotIntegrations || []), ...(allSalesforceIntegrations || [])]
  }, [allHubspotIntegrations, allSalesforceIntegrations])

  const isSyncWithProviderDisabled = !!formikProps.values.providerCustomer?.syncWithProvider
  const hadInitialNetsuiteIntegrationCustomer =
    !!formikProps.initialValues.integrationCustomers?.find(
      (i) => i.integrationType === IntegrationTypeEnum.Netsuite,
    )
  const hadInitialAnrokIntegrationCustomer = !!formikProps.initialValues.integrationCustomers?.find(
    (i) => i.integrationType === IntegrationTypeEnum.Anrok,
  )
  const hadInitialXeroIntegrationCustomer = !!formikProps.initialValues.integrationCustomers?.find(
    (i) => i.integrationType === IntegrationTypeEnum.Xero,
  )
  const hadInitialHubspotIntegrationCustomer =
    !!formikProps.initialValues.integrationCustomers?.find(
      (i) => i.integrationType === IntegrationTypeEnum.Hubspot,
    )
  const hadInitialSalesforceIntegrationCustomer =
    !!formikProps.initialValues.integrationCustomers?.find(
      (i) => i.integrationType === IntegrationTypeEnum.Salesforce,
    )

  const [showPaymentProviderSection, setShowPaymentProviderSection] = useState<boolean>(
    !!formikProps.values.paymentProvider,
  )
  const [showAccountingProviderSection, setShowAccountingProviderSection] = useState<boolean>(
    hadInitialNetsuiteIntegrationCustomer || hadInitialXeroIntegrationCustomer,
  )
  const [showTaxIntegrationSection, setShowTaxIntegrationSection] = useState<boolean>(
    hadInitialAnrokIntegrationCustomer,
  )
  const [showCRMIntegrationSection, setShowCRMIntegrationSection] = useState<boolean>(
    hadInitialHubspotIntegrationCustomer || hadInitialSalesforceIntegrationCustomer,
  )

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

  useEffect(() => {
    setShowPaymentProviderSection(!!formikProps.values.paymentProvider)
  }, [formikProps.values.paymentProvider])

  useEffect(() => {
    setShowAccountingProviderSection(
      hadInitialNetsuiteIntegrationCustomer || hadInitialXeroIntegrationCustomer,
    )
  }, [hadInitialNetsuiteIntegrationCustomer, hadInitialXeroIntegrationCustomer])

  useEffect(() => {
    setShowTaxIntegrationSection(hadInitialAnrokIntegrationCustomer)
  }, [hadInitialAnrokIntegrationCustomer])

  useEffect(() => {
    setShowCRMIntegrationSection(
      hadInitialHubspotIntegrationCustomer || hadInitialSalesforceIntegrationCustomer,
    )
  }, [hadInitialHubspotIntegrationCustomer, hadInitialSalesforceIntegrationCustomer])

  return (
    <Accordion
      size="large"
      onOpen={() => {
        getIntegrationsData()
      }}
      summary={
        <InlineSummaryForExternalApps>
          <LocalPSPIcons />
          <Typography variant="subhead">{translate('text_66423cad72bbad009f2f5689')}</Typography>
        </InlineSummaryForExternalApps>
      }
    >
      <Stack gap={6}>
        <div>
          <Typography variant="bodyHl" color="grey700">
            {translate('text_66423dbab233e60111c49461')}
          </Typography>
          <Typography
            variant="caption"
            color="grey600"
            html={translate('text_66423dbab233e60111c49462', {
              href: INTEGRATIONS_ROUTE,
            })}
          />
        </div>
        {showPaymentProviderSection && (
          <PaymentProvidersAccordion
            formikProps={formikProps}
            setShowPaymentProviderSection={setShowPaymentProviderSection}
          />
        )}
        {showAccountingProviderSection && (
          <AccountingProvidersAccordion
            formikProps={formikProps}
            setShowAccountingProviderSection={setShowAccountingProviderSection}
            isEdition={isEdition}
          />
        )}
        {showTaxIntegrationSection && (
          <TaxProvidersAccordion
            formikProps={formikProps}
            setShowTaxIntegrationSection={setShowTaxIntegrationSection}
            isEdition={isEdition}
          />
        )}
        {showCRMIntegrationSection && (
          <Stack gap={1}>
            <Typography variant="captionHl" color="grey700">
              {translate('text_1728658962985xpfdvl5ru8a')}
            </Typography>
            <Accordion
              noContentMargin
              className={ADD_CUSTOMER_CRM_PROVIDER_ACCORDION}
              summary={
                <ExternalAppsAccordionLayout.Summary
                  avatar={
                    (selectedHubspotIntegrationSettings && (
                      <Avatar size="big" variant="connector">
                        <Hubspot />
                      </Avatar>
                    )) ||
                    (selectedSalesforceIntegrationSettings && (
                      <Avatar size="big" variant="connector">
                        <Salesforce />
                      </Avatar>
                    ))
                  }
                  label={
                    selectedHubspotIntegrationSettings?.name ||
                    selectedSalesforceIntegrationSettings?.name
                  }
                  subLabel={
                    selectedHubspotIntegrationSettings?.code ||
                    selectedSalesforceIntegrationSettings?.code
                  }
                  onDelete={() => {
                    formikProps.setFieldValue(
                      'integrationCustomers',
                      formikProps.values.integrationCustomers?.filter(
                        (i) =>
                          i.integrationType !== IntegrationTypeEnum.Hubspot &&
                          i.integrationType !== IntegrationTypeEnum.Salesforce,
                      ),
                    )
                    setShowCRMIntegrationSection(false)
                  }}
                />
              }
            >
              <Stack gap={6} padding={4}>
                <Typography variant="bodyHl" color="grey700">
                  {translate('text_65e1f90471bc198c0c934d6c')}
                </Typography>

                {/* Select Integration account */}
                <ComboBox
                  onOpen={getIntegrationsData}
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
                    const selectedIntegration = connectedCRMIntegrationsData.find(
                      (data) => data.value === value,
                    )

                    if (selectedIntegration?.group === 'Hubspot') {
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
                          `${hubspotIntegrationpointerInIntegrationCustomer}`,
                          newHubspotIntegrationObject,
                        )
                      }
                    } else if (selectedIntegration?.group === 'Salesforce') {
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
                          `${salesforceIntegrationpointerInIntegrationCustomer}`,
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
                      name={`${hubspotIntegrationpointerInIntegrationCustomer}.targetedObject`}
                      disabled={hadInitialHubspotIntegrationCustomer}
                      data={[
                        {
                          label: translate(
                            getHubspotTargetedObjectTranslationKey[
                              HubspotTargetedObjectsEnum.Companies
                            ],
                          ),
                          value: HubspotTargetedObjectsEnum.Companies,
                        },
                        {
                          label: translate(
                            getHubspotTargetedObjectTranslationKey[
                              HubspotTargetedObjectsEnum.Contacts
                            ],
                          ),
                          value: HubspotTargetedObjectsEnum.Contacts,
                        },
                      ]}
                      PopperProps={{ displayInDialog: true }}
                      formikProps={formikProps}
                    />

                    {!!!!selectedHubspotIntegration.targetedObject && (
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
                          name={`${hubspotIntegrationpointerInIntegrationCustomer}.externalCustomerId`}
                          disabled={
                            !!selectedHubspotIntegration?.syncWithProvider ||
                            hadInitialHubspotIntegrationCustomer
                          }
                          formikProps={formikProps}
                        />

                        <Checkbox
                          name={`${hubspotIntegrationpointerInIntegrationCustomer}.syncWithProvider`}
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
                              `${hubspotIntegrationpointerInIntegrationCustomer}`,
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
                      name={`${salesforceIntegrationpointerInIntegrationCustomer}.externalCustomerId`}
                      disabled={
                        !!selectedSalesforceIntegration.syncWithProvider ||
                        hadInitialSalesforceIntegrationCustomer
                      }
                      formikProps={formikProps}
                    />
                    <Checkbox
                      name={`${salesforceIntegrationpointerInIntegrationCustomer}.syncWithProvider`}
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
                          `${salesforceIntegrationpointerInIntegrationCustomer}`,
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
              </Stack>
            </Accordion>
          </Stack>
        )}
        <Popper
          PopperProps={{ placement: 'bottom-start' }}
          opener={
            <Button
              startIcon="plus"
              variant="quaternary"
              disabled={
                showAccountingProviderSection &&
                showPaymentProviderSection &&
                showTaxIntegrationSection &&
                showCRMIntegrationSection
              }
            >
              {translate('text_65846763e6140b469140e235')}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                align="left"
                disabled={showPaymentProviderSection}
                onClick={() => {
                  setShowPaymentProviderSection(true)

                  setTimeout(() => {
                    const element = document.querySelector(
                      `.${ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                    ) as HTMLElement

                    if (!element) return

                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.click()
                  }, 1)

                  closePopper()
                }}
              >
                {translate('text_634ea0ecc6147de10ddb6631')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                disabled={showAccountingProviderSection}
                onClick={() => {
                  setShowAccountingProviderSection(true)

                  setTimeout(() => {
                    const element = document.querySelector(
                      `.${ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                    ) as HTMLElement

                    if (!element) return

                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.click()
                  }, 1)

                  closePopper()
                }}
              >
                {translate('text_66423cad72bbad009f2f568f')}
              </Button>

              <Button
                variant="quaternary"
                align="left"
                disabled={showTaxIntegrationSection}
                onClick={() => {
                  setShowTaxIntegrationSection(true)

                  setTimeout(() => {
                    const element = document.querySelector(
                      `.${ADD_CUSTOMER_TAX_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                    ) as HTMLElement

                    if (!element) return

                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.click()
                  }, 1)

                  closePopper()
                }}
              >
                {translate('text_6668821d94e4da4dfd8b3840')}
              </Button>

              <Button
                variant="quaternary"
                align="left"
                disabled={showCRMIntegrationSection}
                onClick={() => {
                  setShowCRMIntegrationSection(true)

                  setTimeout(() => {
                    const element = document.querySelector(
                      `.${ADD_CUSTOMER_CRM_PROVIDER_ACCORDION} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`,
                    ) as HTMLElement

                    if (!element) return

                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    element.click()
                  }, 1)

                  closePopper()
                }}
              >
                {translate('text_1728658962985xpfdvl5ru8a')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
        {isSyncWithProviderDisabled &&
          (formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless ||
            formikProps.values.paymentProvider === ProviderTypeEnum.Adyen) && (
            <Alert type="info">
              {formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                ? translate('text_635bdbda84c98758f9bba8ae')
                : translate('text_645d0728ea0a5a7bbf76d5c9')}
            </Alert>
          )}
      </Stack>
    </Accordion>
  )
}

ExternalAppsAccordion.displayName = 'ExternalAppsAccordion'

const InlineSummaryForExternalApps = styled.div`
  display: flex;
  align-items: center;
`

const LocalPSPIcons = styled(PSPIcons)`
  height: 24px;
  margin-right: ${theme.spacing(3)};
`
