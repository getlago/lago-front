import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { FormikProps } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import {
  Accordion,
  Alert,
  Avatar,
  Button,
  Icon,
  Popper,
  Typography,
} from '~/components/designSystem'
import {
  BasicComboBoxData,
  Checkbox,
  ComboBox,
  ComboboxDataGrouped,
  ComboBoxField,
  TextInputField,
} from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import {
  ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION,
  ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION,
  ADD_CUSTOMER_TAX_PROVIDER_ACCORDION,
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import {
  AnrokIntegration,
  CreateCustomerInput,
  CurrencyEnum,
  IntegrationTypeEnum,
  NetsuiteIntegration,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
  useAccountingIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery,
  usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionLazyQuery,
  useSubsidiariesListForCustomerCreateEditExternalAppsAccordionQuery,
  XeroIntegration,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Anrok from '~/public/images/anrok.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Netsuite from '~/public/images/netsuite.svg'
import PSPIcons from '~/public/images/psp-icons.svg'
import Stripe from '~/public/images/stripe.svg'
import Xero from '~/public/images/xero.svg'
import { MenuPopper, theme } from '~/styles'

gql`
  fragment CustomerForExternalAppsAccordion on Customer {
    id
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
  }

  query paymentProvidersListForCustomerCreateEditExternalAppsAccordion($limit: Int) {
    paymentProviders(limit: $limit) {
      collection {
        ... on StripeProvider {
          __typename
          id
          name
          code
        }

        ... on GocardlessProvider {
          __typename
          id
          name
          code
        }

        ... on AdyenProvider {
          __typename
          id
          name
          code
        }
      }
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

  const [getPaymentProvidersData, { data: paymentProvidersData }] =
    usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000 },
    })

  const [getAccountingIntegrationsData, { data: allIntegrationsData }] =
    useAccountingIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000 },
    })

  const selectedPaymentProvider = paymentProvidersData?.paymentProviders?.collection.find(
    (p) => p.code === formikProps.values.paymentProviderCode,
  )

  const allNetsuiteIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allAnrokIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AnrokIntegration',
  ) as AnrokIntegration[] | undefined

  const allXeroIntegrations = allIntegrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'XeroIntegration',
  ) as XeroIntegration[] | undefined

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

  const netsuiteIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedNetsuiteIntegrationIndex}`
  const anrokIntegrationpointerInIntegration = `integrationCustomers.${selectedAnrokIntegrationIndex}`
  const xeroIntegrationpointerInIntegrationCustomer = `integrationCustomers.${selectedXeroIntegrationIndex}`

  const selectedNetsuiteIntegration =
    formikProps.values.integrationCustomers?.[selectedNetsuiteIntegrationIndex]
  const selectedAnrokIntegration =
    formikProps.values.integrationCustomers?.[selectedAnrokIntegrationIndex]
  const selectedXeroIntegration =
    formikProps.values.integrationCustomers?.[selectedXeroIntegrationIndex]

  const selectedNetsuiteIntegrationSettings = allNetsuiteIntegrations?.find(
    (i) => i.code === selectedNetsuiteIntegration?.integrationCode,
  ) as NetsuiteIntegration

  const selectedAnrokIntegrationSettings = allAnrokIntegrations?.find(
    (i) => i.code === selectedAnrokIntegration?.integrationCode,
  ) as AnrokIntegration

  const selectedXeroIntegrationSettings = allXeroIntegrations?.find(
    (i) => i.code === selectedXeroIntegration?.integrationCode,
  ) as XeroIntegration

  const hasAnrokIntegrationFeatureFlag = isFeatureFlagActive(FeatureFlags.ANROK_INTEGRATION)
  const hasXeroIntegrationFeatureFlag = isFeatureFlagActive(FeatureFlags.XERO_INTEGRATION)

  const allAccountingIntegrationsData = useMemo(() => {
    return [
      ...(allNetsuiteIntegrations || []),
      ...(hasXeroIntegrationFeatureFlag ? allXeroIntegrations || [] : []),
    ]
  }, [allNetsuiteIntegrations, allXeroIntegrations, hasXeroIntegrationFeatureFlag])

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

  const [showPaymentProviderSection, setShowPaymentProviderSection] = useState<boolean>(
    !!formikProps.values.paymentProvider,
  )

  const [showAccountingProviderSection, setShowAccountingProviderSection] = useState<boolean>(
    hadInitialNetsuiteIntegrationCustomer || hadInitialXeroIntegrationCustomer,
  )
  const [showTaxIntegrationSection, setShowTaxIntegrationSection] = useState<boolean>(
    hadInitialAnrokIntegrationCustomer,
  )

  const connectedPaymentProvidersData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!paymentProvidersData?.paymentProviders?.collection.length) return []

    return paymentProvidersData?.paymentProviders?.collection.map((provider) => ({
      value: provider.code,
      label: provider.name,
      group: provider.__typename.toLocaleLowerCase().replace('provider', ''),
      labelNode: (
        <Item>
          <Typography color="grey700" noWrap>
            {provider.name}
          </Typography>
          &nbsp;
          <Typography color="textPrimary" noWrap>
            ({provider.code})
          </Typography>
        </Item>
      ),
    }))
  }, [paymentProvidersData?.paymentProviders?.collection])

  const connectedAccountingIntegrationsData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!allAccountingIntegrationsData?.length) return []

    return allAccountingIntegrationsData?.map((integration) => ({
      value: integration.code,
      label: integration.name,
      group: hasXeroIntegrationFeatureFlag
        ? integration?.__typename?.replace('Integration', '') || ''
        : '',
      labelNode: (
        <Item>
          <Typography variant="body" color="grey700" noWrap>
            {integration.name}
          </Typography>
          &nbsp;
          <Typography variant="body" color="grey600" noWrap>
            ({integration.code})
          </Typography>
        </Item>
      ),
    }))
  }, [allAccountingIntegrationsData, hasXeroIntegrationFeatureFlag])

  const connectedIntegrationSubscidiaries: BasicComboBoxData[] | [] = useMemo(() => {
    if (!subsidiariesData?.integrationSubsidiaries?.collection.length) return []

    return subsidiariesData?.integrationSubsidiaries?.collection.map((integrationSubsidiary) => ({
      value: integrationSubsidiary.externalId,
      label: `${integrationSubsidiary.externalName} (${integrationSubsidiary.externalId})`,
      labelNode: (
        <Item>
          <Typography variant="body" color="grey700" noWrap>
            {integrationSubsidiary.externalName}
          </Typography>
          &nbsp;
          <Typography variant="body" color="grey600" noWrap>
            ({integrationSubsidiary.externalId})
          </Typography>
        </Item>
      ),
    }))
  }, [subsidiariesData?.integrationSubsidiaries?.collection])

  const connectedAnrokIntegrationsData: BasicComboBoxData[] | [] = useMemo(() => {
    if (!allAnrokIntegrations?.length) return []

    return allAnrokIntegrations?.map((integration) => ({
      value: integration.code,
      label: integration.name,
      labelNode: (
        <Item>
          <Typography variant="body" color="grey700" noWrap>
            {integration.name}
          </Typography>
          &nbsp;
          <Typography variant="body" color="grey600" noWrap>
            ({integration.code})
          </Typography>
        </Item>
      ),
    }))
  }, [allAnrokIntegrations])

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

  return (
    <Accordion
      size="large"
      onOpen={() => {
        getPaymentProvidersData()
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
          <Stack gap={1}>
            <Typography variant="captionHl" color="grey700">
              {translate('text_66423cad72bbad009f2f568f')}
            </Typography>
            <Accordion
              noContentMargin
              className={ADD_CUSTOMER_PAYMENT_PROVIDER_ACCORDION}
              summary={
                <Stack gap={3} flex={1} direction="row" alignItems="center">
                  <Stack gap={3} flex={1} direction="row" alignItems="center">
                    <Avatar size="big" variant="connector">
                      {!!formikProps.values.paymentProvider ? (
                        <>
                          {formikProps.values.paymentProvider === ProviderTypeEnum?.Stripe ? (
                            <Stripe />
                          ) : formikProps.values.paymentProvider ===
                            ProviderTypeEnum?.Gocardless ? (
                            <GoCardless />
                          ) : formikProps.values.paymentProvider === ProviderTypeEnum?.Adyen ? (
                            <Adyen />
                          ) : null}
                        </>
                      ) : (
                        <Icon name="plug" color="dark" />
                      )}
                    </Avatar>
                    <Stack>
                      <Typography variant="bodyHl" color="grey700">
                        {!selectedPaymentProvider
                          ? translate('text_66423cad72bbad009f2f5691')
                          : selectedPaymentProvider.name}
                      </Typography>
                      {!!selectedPaymentProvider?.code && (
                        <Typography variant="caption">{selectedPaymentProvider.code}</Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Button
                    variant="quaternary"
                    icon="trash"
                    onClick={() => {
                      formikProps.setFieldValue('paymentProvider', null)
                      formikProps.setFieldValue('providerCustomer.providerCustomerId', null)
                      formikProps.setFieldValue('providerCustomer.syncWithProvider', false)
                      formikProps.setFieldValue(
                        'providerCustomer.providerPaymentMethods',
                        formikProps.values.currency !== CurrencyEnum.Eur
                          ? [ProviderPaymentMethodsEnum.Card]
                          : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
                      )
                      setShowPaymentProviderSection(false)
                    }}
                  />
                </Stack>
              }
            >
              <div>
                <Stack gap={6} padding={4}>
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_65e1f90471bc198c0c934d6c')}
                  </Typography>

                  {/* Select connected account */}
                  <ComboBox
                    onOpen={getPaymentProvidersData}
                    data={connectedPaymentProvidersData}
                    label={translate('text_65940198687ce7b05cd62b61')}
                    placeholder={translate('text_65940198687ce7b05cd62b62')}
                    emptyText={translate('text_6645daa0468420011304aded')}
                    PopperProps={{ displayInDialog: true }}
                    value={formikProps.values.paymentProviderCode as string}
                    onChange={(value) => {
                      formikProps.setFieldValue('paymentProviderCode', value)
                      const selectedProvider = connectedPaymentProvidersData.find(
                        (provider) => provider.value === value,
                      )?.group

                      // Set paymentProvider depending on selected value
                      formikProps.setFieldValue(
                        'paymentProvider',
                        selectedProvider as ProviderTypeEnum,
                      )
                    }}
                  />

                  {!!formikProps.values.paymentProviderCode && (
                    <>
                      <TextInputField
                        name="providerCustomer.providerCustomerId"
                        disabled={isSyncWithProviderDisabled}
                        label={translate('text_62b328ead9a4caef81cd9ca0')}
                        placeholder={translate('text_62b328ead9a4caef81cd9ca2')}
                        formikProps={formikProps}
                      />

                      <Checkbox
                        name="providerCustomer.syncWithProvider"
                        value={!!formikProps.values.providerCustomer?.syncWithProvider}
                        label={`${
                          formikProps.values.paymentProvider === ProviderTypeEnum.Gocardless
                            ? translate('text_635bdbda84c98758f9bba8aa')
                            : formikProps.values.paymentProvider === ProviderTypeEnum.Adyen
                              ? translate('text_645d0728ea0a5a7bbf76d5c7')
                              : translate('text_635bdbda84c98758f9bba89e')
                        }${
                          formikProps.values.paymentProviderCode
                            ? ` • ${
                                connectedPaymentProvidersData.find(
                                  (provider) =>
                                    provider.value === formikProps.values.paymentProviderCode,
                                )?.label
                              }`
                            : ''
                        }`}
                        onChange={(e, checked) => {
                          formikProps.setFieldValue('providerCustomer.syncWithProvider', checked)
                          if (!isEdition && checked) {
                            formikProps.setFieldValue(
                              'providerCustomer.providerCustomerId',
                              undefined,
                            )
                          }
                        }}
                      />
                    </>
                  )}
                </Stack>

                {formikProps.values.paymentProvider === ProviderTypeEnum.Stripe && (
                  <Stack gap={6} padding={4} borderTop={`1px solid ${theme.palette.grey[400]}`}>
                    <Stack>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_64aeb7b998c4322918c84204')}
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_64aeb7b998c4322918c84210')}
                      </Typography>
                    </Stack>

                    <Stack gap={1}>
                      <Typography variant="captionHl" color="grey700">
                        {translate('text_65e1f90471bc198c0c934d82')}
                      </Typography>
                      <Checkbox
                        name="providerCustomer.providerPaymentMethods.card"
                        value={
                          !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                            ProviderPaymentMethodsEnum.Card,
                          )
                        }
                        label={translate('text_64aeb7b998c4322918c84208')}
                        sublabel={translate('text_65e1f90471bc198c0c934d86')}
                        disabled={
                          formikProps.values.providerCustomer?.providerPaymentMethods?.length ===
                            1 &&
                          formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                            ProviderPaymentMethodsEnum.Card,
                          )
                        }
                        onChange={(e, checked) => {
                          const newValue = [
                            ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
                          ]

                          if (checked) {
                            newValue.push(ProviderPaymentMethodsEnum.Card)
                          } else {
                            newValue.splice(newValue.indexOf(ProviderPaymentMethodsEnum.Card), 1)
                          }

                          formikProps.setFieldValue(
                            'providerCustomer.providerPaymentMethods',
                            newValue,
                          )
                        }}
                      />
                    </Stack>
                    <Stack spacing={1}>
                      <Typography variant="captionHl" color="grey700">
                        {translate('text_65e1f90471bc198c0c934d88')}
                      </Typography>

                      <SepaGridWrapper>
                        <Checkbox
                          name="providerCustomer.providerPaymentMethods.sepa_debit"
                          value={
                            !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                              ProviderPaymentMethodsEnum.SepaDebit,
                            )
                          }
                          label={translate('text_64aeb7b998c4322918c8420c')}
                          sublabel={translate('text_65e1f90471bc198c0c934d8c')}
                          disabled={
                            formikProps.values.providerCustomer?.providerPaymentMethods?.length ===
                              1 &&
                            formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                              ProviderPaymentMethodsEnum.SepaDebit,
                            )
                          }
                          onChange={(e, checked) => {
                            const newValue = [
                              ...(formikProps.values.providerCustomer?.providerPaymentMethods ||
                                []),
                            ]

                            if (checked) {
                              newValue.push(ProviderPaymentMethodsEnum.SepaDebit)
                            } else {
                              newValue.splice(
                                newValue.indexOf(ProviderPaymentMethodsEnum.SepaDebit),
                                1,
                              )
                            }

                            formikProps.setFieldValue(
                              'providerCustomer.providerPaymentMethods',
                              newValue,
                            )
                          }}
                        />

                        <Checkbox
                          name="providerCustomer.providerPaymentMethods.us_bank_account"
                          value={
                            !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                              ProviderPaymentMethodsEnum.UsBankAccount,
                            )
                          }
                          label={translate('text_65e1f90471bc198c0c934d8e')}
                          sublabel={translate('text_65e1f90471bc198c0c934d90')}
                          disabled={
                            formikProps.values.providerCustomer?.providerPaymentMethods?.length ===
                              1 &&
                            formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                              ProviderPaymentMethodsEnum.UsBankAccount,
                            )
                          }
                          onChange={(e, checked) => {
                            const newValue = [
                              ...(formikProps.values.providerCustomer?.providerPaymentMethods ||
                                []),
                            ]

                            if (checked) {
                              newValue.push(ProviderPaymentMethodsEnum.UsBankAccount)
                            } else {
                              newValue.splice(
                                newValue.indexOf(ProviderPaymentMethodsEnum.UsBankAccount),
                                1,
                              )
                            }

                            formikProps.setFieldValue(
                              'providerCustomer.providerPaymentMethods',
                              newValue,
                            )
                          }}
                        />
                        <Checkbox
                          name="providerCustomer.providerPaymentMethods.bacs_debit"
                          value={
                            !!formikProps.values.providerCustomer?.providerPaymentMethods?.includes(
                              ProviderPaymentMethodsEnum.BacsDebit,
                            )
                          }
                          label={translate('text_65e1f90471bc198c0c934d92')}
                          sublabel={translate('text_65e1f90471bc198c0c934d94')}
                          disabled={
                            formikProps.values.providerCustomer?.providerPaymentMethods?.length ===
                              1 &&
                            formikProps.values.providerCustomer?.providerPaymentMethods.includes(
                              ProviderPaymentMethodsEnum.BacsDebit,
                            )
                          }
                          onChange={(e, checked) => {
                            const newValue = [
                              ...(formikProps.values.providerCustomer?.providerPaymentMethods ||
                                []),
                            ]

                            if (checked) {
                              newValue.push(ProviderPaymentMethodsEnum.BacsDebit)
                            } else {
                              newValue.splice(
                                newValue.indexOf(ProviderPaymentMethodsEnum.BacsDebit),
                                1,
                              )
                            }

                            formikProps.setFieldValue(
                              'providerCustomer.providerPaymentMethods',
                              newValue,
                            )
                          }}
                        />
                      </SepaGridWrapper>
                    </Stack>

                    <Alert type="info">{translate('text_64aeb7b998c4322918c84214')}</Alert>
                  </Stack>
                )}
              </div>
            </Accordion>
          </Stack>
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
                <Stack gap={3} flex={1} direction="row" alignItems="center">
                  <Stack gap={3} flex={1} direction="row" alignItems="center">
                    <Avatar size="big" variant="connector">
                      {!!selectedNetsuiteIntegrationSettings ? (
                        <Netsuite />
                      ) : !!selectedXeroIntegrationSettings ? (
                        <Xero />
                      ) : (
                        <Icon name="plug" color="dark" />
                      )}
                    </Avatar>
                    <Stack>
                      <Typography variant="bodyHl" color="grey700">
                        {!selectedNetsuiteIntegrationSettings
                          ? translate('text_66423cad72bbad009f2f5691')
                          : selectedNetsuiteIntegrationSettings.name}
                      </Typography>
                      {!!selectedNetsuiteIntegrationSettings?.code && (
                        <Typography variant="caption">
                          {selectedNetsuiteIntegrationSettings.code}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Button
                    variant="quaternary"
                    icon="trash"
                    onClick={() => {
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
                </Stack>
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
                        formikProps.setFieldValue(
                          `${netsuiteIntegrationpointerInIntegrationCustomer}.syncWithProvider`,
                          checked,
                        )

                        if (!isEdition && checked) {
                          formikProps.setFieldValue(
                            `${netsuiteIntegrationpointerInIntegrationCustomer}.externalCustomerId`,
                            null,
                          )
                          formikProps.setFieldValue(
                            `${netsuiteIntegrationpointerInIntegrationCustomer}.subsidiaryId`,
                            null,
                          )
                        }
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
                        formikProps.setFieldValue(
                          `${xeroIntegrationpointerInIntegrationCustomer}.syncWithProvider`,
                          checked,
                        )

                        if (!isEdition && checked) {
                          formikProps.setFieldValue(
                            `${xeroIntegrationpointerInIntegrationCustomer}.externalCustomerId`,
                            null,
                          )
                          formikProps.setFieldValue(
                            `${xeroIntegrationpointerInIntegrationCustomer}.subsidiaryId`,
                            null,
                          )
                        }
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
                <Stack gap={3} flex={1} direction="row" alignItems="center">
                  <Stack gap={3} flex={1} direction="row" alignItems="center">
                    <Avatar size="big" variant="connector">
                      {showTaxIntegrationSection && !!selectedAnrokIntegrationSettings ? (
                        <Anrok />
                      ) : (
                        <Icon name="plug" color="dark" />
                      )}
                    </Avatar>
                    <Stack>
                      <Typography variant="bodyHl" color="grey700">
                        {!selectedAnrokIntegrationSettings
                          ? translate('text_66423cad72bbad009f2f5691')
                          : selectedAnrokIntegrationSettings.name}
                      </Typography>
                      {!!selectedAnrokIntegrationSettings?.code && (
                        <Typography variant="caption">
                          {selectedAnrokIntegrationSettings.code}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Button
                    variant="quaternary"
                    icon="trash"
                    onClick={() => {
                      formikProps.setFieldValue(
                        'integrationCustomers',
                        formikProps.values.integrationCustomers?.filter(
                          (i) => i.integrationType !== IntegrationTypeEnum.Anrok,
                        ),
                      )
                      setShowTaxIntegrationSection(false)
                    }}
                  />
                </Stack>
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
                      name={`${anrokIntegrationpointerInIntegration}.externalCustomerId`}
                      disabled={
                        !!selectedAnrokIntegration?.syncWithProvider ||
                        hadInitialAnrokIntegrationCustomer
                      }
                      label={translate('text_66423cad72bbad009f2f569a')}
                      placeholder={translate('text_66423cad72bbad009f2f569c')}
                      formikProps={formikProps}
                    />

                    <Checkbox
                      name={`${anrokIntegrationpointerInIntegration}.syncWithProvider`}
                      disabled={hadInitialAnrokIntegrationCustomer}
                      value={!!selectedAnrokIntegration?.syncWithProvider}
                      label={translate('text_66423cad72bbad009f2f569e', {
                        connectionName: selectedAnrokIntegrationSettings?.name,
                      })}
                      onChange={(_, checked) => {
                        formikProps.setFieldValue(
                          `${anrokIntegrationpointerInIntegration}.syncWithProvider`,
                          checked,
                        )

                        if (!isEdition && checked) {
                          formikProps.setFieldValue(
                            `${anrokIntegrationpointerInIntegration}.externalCustomerId`,
                            null,
                          )
                        }
                      }}
                    />
                  </>
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
                showTaxIntegrationSection
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
                {translate('text_66423dbab233e60111c49464')}
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

              {hasAnrokIntegrationFeatureFlag && (
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
                  {translate('text_66798355dbb93a0065e3a423')}
                </Button>
              )}
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

const SepaGridWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing(4)};
`

const InlineSummaryForExternalApps = styled.div`
  display: flex;
  align-items: center;
`

const LocalPSPIcons = styled(PSPIcons)`
  height: 24px;
  margin-right: ${theme.spacing(3)};
`
