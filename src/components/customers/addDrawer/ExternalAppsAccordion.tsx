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
  MUI_BUTTON_BASE_ROOT_CLASSNAME,
} from '~/core/constants/form'
import { INTEGRATIONS_ROUTE } from '~/core/router'
import {
  CreateCustomerInput,
  CurrencyEnum,
  IntegrationTypeEnum,
  ProviderPaymentMethodsEnum,
  ProviderTypeEnum,
  UpdateCustomerInput,
  useIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery,
  usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionLazyQuery,
  useSubsidiariesListForCustomerCreateEditExternalAppsAccordionQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import GoCardless from '~/public/images/gocardless.svg'
import Netsuite from '~/public/images/netsuite.svg'
import PSPIcons from '~/public/images/psp-icons.svg'
import Stripe from '~/public/images/stripe.svg'
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

  query integrationsListForCustomerEditExternalAppsAccordion(
    $limit: Int
    $page: Int
    $type: IntegrationTypeEnum
  ) {
    integrations(limit: $limit, page: $page, type: $type) {
      collection {
        ... on NetsuiteIntegration {
          id
          code
          name
        }
        # OktaIntegration have to be defined to fix TS linting
        ... on OktaIntegration {
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

  const [showPaymentProviderSection, setShowPaymentProviderSection] = useState<boolean>(
    !!formikProps.values.paymentProvider,
  )

  const [showAccountingProviderSection, setShowAccountingProviderSection] = useState<boolean>(
    !!formikProps.values.integrationCustomer,
  )

  const [getProvidersData, { data: providersData }] =
    usePaymentProvidersListForCustomerCreateEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000 },
    })

  const [getIntegrationsData, { data: integrationsData }] =
    useIntegrationsListForCustomerEditExternalAppsAccordionLazyQuery({
      variables: { limit: 1000, type: IntegrationTypeEnum.Netsuite },
    })

  const selectedPaymentProvider = providersData?.paymentProviders?.collection.find(
    (p) => p.code === formikProps.values.paymentProviderCode,
  )

  const selectedNetsuiteIntegration = integrationsData?.integrations?.collection.find(
    (i) => i.code === formikProps.values.integrationCustomer?.integrationCode,
  )

  const { data: subsidiariesData } =
    useSubsidiariesListForCustomerCreateEditExternalAppsAccordionQuery({
      variables: { integrationId: selectedNetsuiteIntegration?.id },
      skip: !selectedNetsuiteIntegration?.id,
    })

  const isSyncWithProviderDisabled = !!formikProps.values.providerCustomer?.syncWithProvider

  const connectedProvidersData: ComboboxDataGrouped[] | [] = useMemo(() => {
    if (!providersData?.paymentProviders?.collection.length) return []

    return providersData?.paymentProviders?.collection.map((provider) => ({
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
  }, [providersData?.paymentProviders?.collection])

  const connectedIntegrationsData: BasicComboBoxData[] | [] = useMemo(() => {
    if (!integrationsData?.integrations?.collection.length) return []

    return integrationsData?.integrations?.collection.map((integration) => ({
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
  }, [integrationsData?.integrations?.collection])

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

  useEffect(() => {
    setShowPaymentProviderSection(!!formikProps.values.paymentProvider)
  }, [formikProps.values.paymentProvider])

  useEffect(() => {
    setShowAccountingProviderSection(!!formikProps.values.integrationCustomer)
  }, [formikProps.values.integrationCustomer])

  return (
    <Accordion
      size="large"
      onOpen={() => {
        getProvidersData()
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
                        ) : formikProps.values.paymentProvider === ProviderTypeEnum?.Gocardless ? (
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
                  onOpen={getProvidersData}
                  data={connectedProvidersData}
                  label={translate('text_65940198687ce7b05cd62b61')}
                  placeholder={translate('text_65940198687ce7b05cd62b62')}
                  emptyText={translate('text_6645daa0468420011304aded')}
                  PopperProps={{ displayInDialog: true }}
                  value={formikProps.values.paymentProviderCode as string}
                  onChange={(value) => {
                    formikProps.setFieldValue('paymentProviderCode', value)
                    const selectedProvider = connectedProvidersData.find(
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
                          ? ` • ${connectedProvidersData.find(
                              (provider) =>
                                provider.value === formikProps.values.paymentProviderCode,
                            )?.label}`
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
                        formikProps.values.providerCustomer?.providerPaymentMethods?.length === 1 &&
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
                            ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
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
                            ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
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
                            ...(formikProps.values.providerCustomer?.providerPaymentMethods || []),
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
        )}

        {showAccountingProviderSection && (
          <Accordion
            noContentMargin
            className={ADD_CUSTOMER_ACCOUNTING_PROVIDER_ACCORDION}
            summary={
              <Stack gap={3} flex={1} direction="row" alignItems="center">
                <Stack gap={3} flex={1} direction="row" alignItems="center">
                  <Avatar size="big" variant="connector">
                    {showAccountingProviderSection && !!formikProps.values.integrationCustomer ? (
                      <Netsuite />
                    ) : (
                      <Icon name="plug" color="dark" />
                    )}
                  </Avatar>
                  <Stack>
                    <Typography variant="bodyHl" color="grey700">
                      {!selectedNetsuiteIntegration
                        ? translate('text_66423cad72bbad009f2f5691')
                        : selectedNetsuiteIntegration.name}
                    </Typography>
                    {!!selectedNetsuiteIntegration?.code && (
                      <Typography variant="caption">{selectedNetsuiteIntegration.code}</Typography>
                    )}
                  </Stack>
                </Stack>

                <Button
                  variant="quaternary"
                  icon="trash"
                  onClick={() => {
                    formikProps.setFieldValue('integrationCustomer', null)
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
                onOpen={getIntegrationsData}
                data={connectedIntegrationsData}
                label={translate('text_66423cad72bbad009f2f5695')}
                placeholder={translate('text_66423cad72bbad009f2f5697')}
                emptyText={translate('text_6645daa0468420011304aded')}
                PopperProps={{ displayInDialog: true }}
                value={formikProps.values.integrationCustomer?.integrationCode as string}
                onChange={(value) => {
                  formikProps.setFieldValue('integrationCustomer', {
                    integrationCode: value,
                    integrationType: IntegrationTypeEnum.Netsuite,
                    syncWithProvider: false,
                  })
                }}
              />

              {!!formikProps.values.integrationCustomer && (
                <>
                  <TextInputField
                    name="integrationCustomer.externalCustomerId"
                    disabled={!!formikProps.values.integrationCustomer?.syncWithProvider}
                    label={translate('text_66423cad72bbad009f2f569a')}
                    placeholder={translate('text_66423cad72bbad009f2f569c')}
                    formikProps={formikProps}
                  />

                  <Checkbox
                    name="integrationCustomer.syncWithProvider"
                    value={!!formikProps.values.integrationCustomer?.syncWithProvider}
                    label={translate('text_66423cad72bbad009f2f569e', {
                      connectionName: selectedNetsuiteIntegration?.name,
                    })}
                    onChange={(_, checked) => {
                      formikProps.setFieldValue('integrationCustomer.syncWithProvider', checked)

                      if (!isEdition && checked) {
                        formikProps.setFieldValue('integrationCustomer.externalCustomerId', null)
                        formikProps.setFieldValue('integrationCustomer.subsidiaryId', null)
                      }
                    }}
                  />

                  {!!formikProps.values.integrationCustomer?.syncWithProvider && (
                    <>
                      <ComboBoxField
                        name="integrationCustomer.subsidiaryId"
                        data={connectedIntegrationSubscidiaries}
                        label={translate('text_66423cad72bbad009f2f56a0')}
                        placeholder={translate('text_66423cad72bbad009f2f56a2')}
                        PopperProps={{ displayInDialog: true }}
                        formikProps={formikProps}
                      />

                      {isEdition && (
                        <Alert type="info">{translate('text_66423cad72bbad009f2f56a4')}</Alert>
                      )}
                    </>
                  )}
                </>
              )}
            </Stack>
          </Accordion>
        )}

        <Popper
          PopperProps={{ placement: 'bottom-start' }}
          opener={
            <Button
              startIcon="plus"
              variant="quaternary"
              disabled={showAccountingProviderSection && showPaymentProviderSection}
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
                  }, 0)

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
                  }, 0)

                  closePopper()
                }}
                data-test="add-free-units-total-amount"
              >
                {translate('text_66423cad72bbad009f2f568f')}
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
