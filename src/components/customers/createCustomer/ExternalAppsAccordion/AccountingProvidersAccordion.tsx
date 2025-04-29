import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { Avatar } from 'lago-design-system'
import { Dispatch, FC, SetStateAction, useMemo } from 'react'

import { Accordion, Alert, Typography } from '~/components/designSystem'
import {
  BasicComboBoxData,
  Checkbox,
  ComboBox,
  ComboboxDataGrouped,
  ComboBoxField,
  TextInputField,
} from '~/components/form'
import { ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION } from '~/core/constants/form'
import {
  CreateCustomerInput,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  UpdateCustomerInput,
  useGetAccountingIntegrationsForExternalAppsAccordionQuery,
  useSubsidiariesListForExternalAppsAccordionQuery,
  XeroIntegration,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Netsuite from '~/public/images/netsuite.svg'
import Xero from '~/public/images/xero.svg'

import { ExternalAppsAccordionLayout } from './ExternalAppsAccordionLayout'
import { getIntegration } from './utils'

gql`
  query getAccountingIntegrationsForExternalAppsAccordion($limit: Int, $page: Int) {
    integrations(limit: $limit, page: $page) {
      collection {
        ... on NetsuiteIntegration {
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
      }
    }
  }

  query subsidiariesListForExternalAppsAccordion($integrationId: ID) {
    integrationSubsidiaries(integrationId: $integrationId) {
      collection {
        externalId
        externalName
      }
    }
  }
`

interface AccountingProvidersAccordionProps {
  formikProps: FormikProps<CreateCustomerInput | UpdateCustomerInput>
  setShowAccountingSection: Dispatch<SetStateAction<boolean>>
  isEdition: boolean
}

export const AccountingProvidersAccordion: FC<AccountingProvidersAccordionProps> = ({
  formikProps,
  setShowAccountingSection,
  isEdition,
}) => {
  const { translate } = useInternationalization()

  const { data: allIntegrationsData, loading } =
    useGetAccountingIntegrationsForExternalAppsAccordionQuery({
      variables: { limit: 1000 },
    })

  const {
    hadInitialIntegrationCustomer: hadInitialNetsuiteIntegrationCustomer,
    selectedIntegration: selectedNetsuiteIntegration,
    integrationPointerInIntegrationCustomer: netsuiteIntegrationPointerInIntegrationCustomer,
    allIntegrations: allNetsuiteIntegrations,
    selectedIntegrationSettings: selectedNetsuiteIntegrationSettings,
  } = getIntegration<NetsuiteIntegration>({
    integrationType: IntegrationTypeEnum.Netsuite,
    allIntegrationsData,
    formikProps,
  })

  // Only fetch subsidiaries if there is a selected Netsuite integration
  const { data: subsidiariesData } = useSubsidiariesListForExternalAppsAccordionQuery({
    variables: { integrationId: selectedNetsuiteIntegrationSettings?.id },
    skip: !selectedNetsuiteIntegrationSettings?.id,
  })

  const {
    hadInitialIntegrationCustomer: hadInitialXeroIntegrationCustomer,
    selectedIntegration: selectedXeroIntegration,
    integrationPointerInIntegrationCustomer: xeroIntegrationPointerInIntegrationCustomer,
    allIntegrations: allXeroIntegrations,
    selectedIntegrationSettings: selectedXeroIntegrationSettings,
  } = getIntegration<XeroIntegration>({
    integrationType: IntegrationTypeEnum.Xero,
    allIntegrationsData,
    formikProps,
  })

  const selectedIntegration = selectedNetsuiteIntegration || selectedXeroIntegration
  const selectedIntegrationSettings =
    selectedNetsuiteIntegrationSettings || selectedXeroIntegrationSettings

  const allAccountingIntegrationsData = useMemo(() => {
    return [...(allNetsuiteIntegrations || []), ...(allXeroIntegrations || [])]
  }, [allNetsuiteIntegrations, allXeroIntegrations])

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

  return (
    <div>
      <Typography variant="captionHl" color="grey700" className="mb-1">
        {translate('text_66423cad72bbad009f2f568f')}
      </Typography>
      <Accordion
        noContentMargin
        className={ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION}
        summary={
          <ExternalAppsAccordionLayout.Summary
            loading={loading}
            avatar={
              selectedIntegration && (
                <Avatar size="big" variant="connector-full">
                  {selectedIntegration.integrationType === IntegrationTypeEnum.Netsuite && (
                    <Netsuite />
                  )}
                  {selectedIntegration.integrationType === IntegrationTypeEnum.Xero && <Xero />}
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
                    i.integrationType !== IntegrationTypeEnum.Netsuite &&
                    i.integrationType !== IntegrationTypeEnum.Xero,
                ),
              )
              setShowAccountingSection(false)
            }}
          />
        }
      >
        <div className="flex flex-col gap-6 p-4">
          <Typography variant="bodyHl" color="grey700">
            {translate('text_65e1f90471bc198c0c934d6c')}
          </Typography>

          {/* Select Integration account */}
          <ComboBox
            disabled={hadInitialNetsuiteIntegrationCustomer || hadInitialXeroIntegrationCustomer}
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
                name={`${netsuiteIntegrationPointerInIntegrationCustomer}.externalCustomerId`}
                disabled={
                  !!selectedNetsuiteIntegration?.syncWithProvider ||
                  hadInitialNetsuiteIntegrationCustomer
                }
                label={translate('text_66423cad72bbad009f2f569a')}
                placeholder={translate('text_66423cad72bbad009f2f569c')}
                formikProps={formikProps}
              />

              <Checkbox
                name={`${netsuiteIntegrationPointerInIntegrationCustomer}.syncWithProvider`}
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
                    `${netsuiteIntegrationPointerInIntegrationCustomer}`,
                    newNetsuiteIntegrationObject,
                  )
                }}
              />

              {!!selectedNetsuiteIntegration?.syncWithProvider && (
                <>
                  <ComboBoxField
                    name={`${netsuiteIntegrationPointerInIntegrationCustomer}.subsidiaryId`}
                    data={connectedIntegrationSubsidiaries}
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
                name={`${xeroIntegrationPointerInIntegrationCustomer}.externalCustomerId`}
                disabled={
                  !!selectedXeroIntegration?.syncWithProvider || hadInitialXeroIntegrationCustomer
                }
                label={translate('text_667d39dc1a765800d28d0604')}
                placeholder={translate('text_667d39dc1a765800d28d0605')}
                formikProps={formikProps}
              />

              <Checkbox
                name={`${xeroIntegrationPointerInIntegrationCustomer}.syncWithProvider`}
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
                    `${xeroIntegrationPointerInIntegrationCustomer}`,
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
        </div>
      </Accordion>
    </div>
  )
}
