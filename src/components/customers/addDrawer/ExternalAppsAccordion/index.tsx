import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { Accordion, Alert, Avatar, Button, Popper, Typography } from '~/components/designSystem'
import {
  BasicComboBoxData,
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
  AnrokIntegration,
  CreateCustomerInput,
  CustomerTypeEnum,
  HubspotIntegration,
  HubspotTargetedObjectsEnum,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  ProviderTypeEnum,
  SalesforceIntegration,
  UpdateCustomerInput,
  useAccountingIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery,
  useSubsidiariesListForCustomerCreateEditExternalAppsAccordionQuery,
  XeroIntegration,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Anrok from '~/public/images/anrok.svg'
import Hubspot from '~/public/images/hubspot.svg'
import Netsuite from '~/public/images/netsuite.svg'
import PSPIcons from '~/public/images/psp-icons.svg'
import Salesforce from '~/public/images/salesforce.svg'
import Xero from '~/public/images/xero.svg'
import { MenuPopper, theme } from '~/styles'

import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'
import { PaymentProvidersAccordion } from './PaymentProvidersAccordion'

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

  query accountingIntegrationsListForCustomerEditExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on NetsuiteIntegration {
          __typename
          id
          code
          name
        }
        ... on AnrokIntegration {
          __typename
          id
          code
          name
        }
        ... on XeroIntegration {
          __typename
          id
          code
          name
        }
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

  query subsidiariesListForCustomerCreateEditExternalAppsAccordion($integrationId: ID) {
    integrationSubsidiaries(integrationId: $integrationId) {
      collection {
        externalId
        externalName
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

  const [getAccountingIntegrationsData, { data: allIntegrationsData }] =
    useAccountingIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000 },
    })

  const allNetsuiteIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allAnrokIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AnrokIntegration',
  ) as AnrokIntegration[] | undefined

  const allXeroIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'XeroIntegration',
  ) as XeroIntegration[] | undefined

  const allHubspotIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'HubspotIntegration',
  ) as HubspotIntegration[] | undefined

  const allSalesforceIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'SalesforceIntegration',
  ) as SalesforceIntegration[] | undefined

  const selectedNetsuiteIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Netsuite,
    ) || 0
  const selectedAnrokIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Anrok,
    ) || 0
  const selectedXeroIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Xero,
    ) || 0
  const selectedHubspotIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Hubspot,
    ) || 0
  const selectedSalesforceIntegrationIndex =
    formikProps.values.integrationCustomers?.findIndex(
      (i) => i.integrationType === IntegrationTypeEnum.Salesforce,
    ) || 0

  const netsuiteIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedNetsuiteIntegrationIndex}`
  const anrokIntegrationpointerInIntegration = `integrationCustomers.${selectedAnrokIntegrationIndex}`
  const xeroIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedXeroIntegrationIndex}`
  const hubspotIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedHubspotIntegrationIndex}`
  const salesforceIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedSalesforceIntegrationIndex}`

  const selectedNetsuiteIntegration =
    formikProps.values.integrationCustomers?.[selectedNetsuiteIntegrationIndex]
  const selectedAnrokIntegration =
    formikProps.values.integrationCustomers?.[selectedAnrokIntegrationIndex]
  const selectedXeroIntegration =
    formikProps.values.integrationCustomers?.[selectedXeroIntegrationIndex]
  const selectedHubspotIntegration =
    formikProps.values.integrationCustomers?.[selectedHubspotIntegrationIndex]
  const selectedSalesforceIntegration =
    formikProps.values.integrationCustomers?.[selectedSalesforceIntegrationIndex]

  const selectedNetsuiteIntegrationSettings = allNetsuiteIntegrations?.find(
    (i) => i.code === selectedNetsuiteIntegration?.integrationCode,
  ) as NetsuiteIntegration

  const selectedAnrokIntegrationSettings = allAnrokIntegrations?.find(
    (i) => i.code === selectedAnrokIntegration?.integrationCode,
  ) as AnrokIntegration

  const selectedXeroIntegrationSettings = allXeroIntegrations?.find(
    (i) => i.code === selectedXeroIntegration?.integrationCode,
  ) as XeroIntegration

  const selectedHubspotIntegrationSettings = allHubspotIntegrations?.find(
    (i) => i.code === selectedHubspotIntegration?.integrationCode,
  ) as HubspotIntegration

  const selectedSalesforceIntegrationSettings = allSalesforceIntegrations?.find(
    (i) => i.code === selectedSalesforceIntegration?.integrationCode,
  ) as SalesforceIntegration

  const allAccountingIntegrationsData = useMemo(() => {
    return [...(allNetsuiteIntegrations || []), ...(allXeroIntegrations || [])]
  }, [allNetsuiteIntegrations, allXeroIntegrations])

  const allCRMIntegrationsData = useMemo(() => {
    return [...(allHubspotIntegrations || []), ...(allSalesforceIntegrations || [])]
  }, [allHubspotIntegrations, allSalesforceIntegrations])

  const { data: subsidiariesData } =
    useSubsidiariesListForCustomerCreateEditExternalAppsAccordionQuery({
      variables: { integrationId: selectedNetsuiteIntegrationSettings?.id },
      skip: !selectedNetsuiteIntegrationSettings?.id,
    })

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

  const connectedAccountingIntegrationsData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!allAccountingIntegrationsData?.length) return []

    return allAccountingIntegrationsData?.map((integration) => ({
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
  }, [allAccountingIntegrationsData])

  const connectedIntegrationSubscidiaries: BasicComboBoxData[] | [] = useMemo(() => {
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

  const connectedAnrokIntegrationsData: BasicComboBoxData[] | [] = useMemo(() => {
    if (!allAnrokIntegrations?.length) return []

    return allAnrokIntegrations?.map((integration) => ({
      value: integration.code,
      label: integration.name,
      labelNode: (
        <ExternalAppsAccordionLayout.ComboboxItem
          label={integration.name}
          subLabel={integration.code}
        />
      ),
    }))
  }, [allAnrokIntegrations])

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
        getAccountingIntegrationsData()
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
          <Stack gap={1}>
            <Typography variant="captionHl" color="grey700">
              {translate('text_66423cad72bbad009f2f568f')}
            </Typography>
            <Accordion
              noContentMargin
              className={ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION}
              summary={
                <ExternalAppsAccordionLayout.Summary
                  avatar={
                    (selectedNetsuiteIntegrationSettings && (
                      <Avatar size="big" variant="connector-full">
                        <Netsuite />
                      </Avatar>
                    )) ||
                    (selectedXeroIntegrationSettings && (
                      <Avatar size="big" variant="connector-full">
                        <Xero />
                      </Avatar>
                    ))
                  }
                  label={
                    selectedNetsuiteIntegrationSettings?.name ||
                    selectedXeroIntegrationSettings?.name
                  }
                  subLabel={
                    selectedNetsuiteIntegrationSettings?.code ||
                    selectedXeroIntegrationSettings?.code
                  }
                  onDelete={() => {
                    formikProps.setFieldValue(
                      'integrationCustomers',
                      formikProps.values.integrationCustomers?.filter(
                        (i) =>
                          i.integrationType !== IntegrationTypeEnum.Netsuite &&
                          i.integrationType !== IntegrationTypeEnum.Xero,
                      ),
                    )
                    setShowAccountingProviderSection(false)
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
                  onOpen={getAccountingIntegrationsData}
                  disabled={
                    hadInitialNetsuiteIntegrationCustomer || hadInitialXeroIntegrationCustomer
                  }
                  data={connectedAccountingIntegrationsData}
                  label={translate('text_66423cad72bbad009f2f5695')}
                  placeholder={translate('text_66423cad72bbad009f2f5697')}
                  emptyText={translate('text_6645daa0468420011304aded')}
                  PopperProps={{ displayInDialog: true }}
                  value={
                    (selectedNetsuiteIntegration?.integrationCode ||
                      selectedXeroIntegration?.integrationCode) as string
                  }
                  onChange={(value) => {
                    const isValueAlreadyPresent = formikProps.values.integrationCustomers?.some(
                      (i) => i.integrationCode === value,
                    )

                    if (!!value && !isValueAlreadyPresent) {
                      // By default, remove existing accounting integration, will be added back if value is present
                      const newIntegrationCustomers =
                        formikProps.values.integrationCustomers?.filter(
                          (i) =>
                            i.integrationType !== IntegrationTypeEnum.Netsuite &&
                            i.integrationType !== IntegrationTypeEnum.Xero,
                        ) || []

                      const selectedAccountingIntegration = allAccountingIntegrationsData.find(
                        (i) => i.code === value,
                      )

                      const newAccountingIntegrationObject = {
                        integrationCode: value,
                        integrationType: selectedAccountingIntegration?.__typename
                          ?.toLowerCase()
                          .replace('integration', '') as IntegrationTypeEnum,
                        syncWithProvider: false,
                      }

                      newIntegrationCustomers.push(newAccountingIntegrationObject)

                      formikProps.setFieldValue('integrationCustomers', newIntegrationCustomers)
                    }
                  }}
                />

                {!!selectedNetsuiteIntegration && (
                  <>
                    <TextInputField
                      name={`${netsuiteIntegrationpointerInIntegrationCustomer}.externalCustomerId`}
                      disabled={
                        !!selectedNetsuiteIntegration?.syncWithProvider ||
                        hadInitialNetsuiteIntegrationCustomer
                      }
                      label={translate('text_66423cad72bbad009f2f569a')}
                      placeholder={translate('text_66423cad72bbad009f2f569c')}
                      formikProps={formikProps}
                    />

                    <Checkbox
                      name={`${netsuiteIntegrationpointerInIntegrationCustomer}.syncWithProvider`}
                      disabled={hadInitialNetsuiteIntegrationCustomer}
                      value={!!selectedNetsuiteIntegration?.syncWithProvider}
                      label={translate('text_66423cad72bbad009f2f569e', {
                        connectionName: selectedNetsuiteIntegrationSettings?.name,
                      })}
                      onChange={(_, checked) => {
                        const newNetsuiteIntegrationObject = {
                          ...selectedNetsuiteIntegration,
                          syncWithProvider: checked,
                        }

                        if (!isEdition && checked) {
                          newNetsuiteIntegrationObject.externalCustomerId = ''
                          newNetsuiteIntegrationObject.subsidiaryId = ''
                        }

                        formikProps.setFieldValue(
                          `${netsuiteIntegrationpointerInIntegrationCustomer}`,
                          newNetsuiteIntegrationObject,
                        )
                      }}
                    />

                    {!!selectedNetsuiteIntegration?.syncWithProvider && (
                      <>
                        <ComboBoxField
                          name={`${netsuiteIntegrationpointerInIntegrationCustomer}.subsidiaryId`}
                          data={connectedIntegrationSubscidiaries}
                          disabled={hadInitialNetsuiteIntegrationCustomer}
                          label={translate('text_66423cad72bbad009f2f56a0')}
                          placeholder={translate('text_66423cad72bbad009f2f56a2')}
                          PopperProps={{ displayInDialog: true }}
                          formikProps={formikProps}
                        />

                        {isEdition && !hadInitialNetsuiteIntegrationCustomer && (
                          <Alert type="info">{translate('text_66423cad72bbad009f2f56a4')}</Alert>
                        )}
                      </>
                    )}
                  </>
                )}

                {!!selectedXeroIntegration && (
                  <>
                    <TextInputField
                      name={`${xeroIntegrationpointerInIntegrationCustomer}.externalCustomerId`}
                      disabled={
                        !!selectedXeroIntegration?.syncWithProvider ||
                        hadInitialXeroIntegrationCustomer
                      }
                      label={translate('text_667d39dc1a765800d28d0604')}
                      placeholder={translate('text_667d39dc1a765800d28d0605')}
                      formikProps={formikProps}
                    />

                    <Checkbox
                      name={`${xeroIntegrationpointerInIntegrationCustomer}.syncWithProvider`}
                      disabled={hadInitialXeroIntegrationCustomer}
                      value={!!selectedXeroIntegration?.syncWithProvider}
                      label={translate('text_66423cad72bbad009f2f569e', {
                        connectionName: selectedXeroIntegrationSettings?.name,
                      })}
                      onChange={(_, checked) => {
                        const newXeroIntegrationObject = {
                          ...selectedXeroIntegration,
                          syncWithProvider: checked,
                        }

                        if (!isEdition && checked) {
                          newXeroIntegrationObject.externalCustomerId = ''
                        }

                        formikProps.setFieldValue(
                          `${xeroIntegrationpointerInIntegrationCustomer}`,
                          newXeroIntegrationObject,
                        )
                      }}
                    />
                  </>
                )}

                {isEdition &&
                  !!selectedXeroIntegration?.syncWithProvider &&
                  !hadInitialXeroIntegrationCustomer && (
                    <Alert type="info">{translate('text_667d39dc1a765800d28d0607')}</Alert>
                  )}
              </Stack>
            </Accordion>
          </Stack>
        )}
        {showTaxIntegrationSection && (
          <Stack gap={1}>
            <Typography variant="captionHl" color="grey700">
              {translate('text_6668821d94e4da4dfd8b3840')}
            </Typography>
            <Accordion
              noContentMargin
              className={ADD_CUSTOMER_TAX_PROVIDER_ACCORDION}
              summary={
                <ExternalAppsAccordionLayout.Summary
                  avatar={
                    selectedAnrokIntegrationSettings && (
                      <Avatar size="big" variant="connector-full">
                        <Anrok />
                      </Avatar>
                    )
                  }
                  label={selectedAnrokIntegrationSettings?.name}
                  subLabel={selectedAnrokIntegrationSettings?.code}
                  onDelete={() => {
                    formikProps.setFieldValue(
                      'integrationCustomers',
                      formikProps.values.integrationCustomers?.filter(
                        (i) => i.integrationType !== IntegrationTypeEnum.Anrok,
                      ),
                    )
                    setShowTaxIntegrationSection(false)
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
                  onOpen={getAccountingIntegrationsData}
                  disabled={hadInitialAnrokIntegrationCustomer}
                  data={connectedAnrokIntegrationsData}
                  label={translate('text_66423cad72bbad009f2f5695')}
                  placeholder={translate('text_66423cad72bbad009f2f5697')}
                  emptyText={translate('text_6645daa0468420011304aded')}
                  PopperProps={{ displayInDialog: true }}
                  value={selectedAnrokIntegration?.integrationCode as string}
                  onChange={(value) => {
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
                        `${anrokIntegrationpointerInIntegration}`,
                        newAnrokIntegrationObject,
                      )
                    }
                  }}
                />

                {!!selectedAnrokIntegration && (
                  <>
                    <TextInputField
                      label={translate('text_66b4e77677f8c600c8d50ea3')}
                      placeholder={translate('text_66b4e77677f8c600c8d50ea5')}
                      name={`${anrokIntegrationpointerInIntegration}.externalCustomerId`}
                      disabled={
                        !!selectedAnrokIntegration?.syncWithProvider ||
                        hadInitialAnrokIntegrationCustomer
                      }
                      formikProps={formikProps}
                    />

                    <Checkbox
                      name={`${anrokIntegrationpointerInIntegration}.syncWithProvider`}
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
                          `${anrokIntegrationpointerInIntegration}`,
                          newAnrokIntegrationObject,
                        )
                      }}
                    />
                  </>
                )}
              </Stack>
            </Accordion>
          </Stack>
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
                  onOpen={getAccountingIntegrationsData}
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
