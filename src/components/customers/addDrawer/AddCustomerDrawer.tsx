import { Grid } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { array, object, string } from 'yup'

import { TRANSLATIONS_MAP_CUSTOMER_TYPE } from '~/components/customers/utils'
import { Accordion, Button, Card, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import { Checkbox, ComboBoxField, TextInputField } from '~/components/form'
import { hasDefinedGQLError } from '~/core/apolloClient'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { ORGANIZATION_INFORMATIONS_ROUTE } from '~/core/router'
import { getTimezoneConfig } from '~/core/timezone'
import { metadataSchema } from '~/formValidation/metadataSchema'
import {
  AddCustomerDrawerFragment,
  AnrokCustomer,
  CreateCustomerInput,
  CurrencyEnum,
  CustomerTypeEnum,
  HubspotCustomer,
  IntegrationTypeEnum,
  NetsuiteCustomer,
  ProviderCustomer,
  ProviderPaymentMethodsEnum,
  SalesforceCustomer,
  TimezoneEnum,
  UpdateCustomerInput,
  XeroCustomer,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { DrawerContent, DrawerSubmitButton, DrawerTitle, theme } from '~/styles'

import { ExternalAppsAccordion } from './ExternalAppsAccordion'
import { LocalCustomerMetadata, MetadataAccordion } from './MetadataAccordion'

export interface AddCustomerDrawerRef {
  openDrawer: (customer?: AddCustomerDrawerFragment | null) => unknown
  closeDrawer: () => unknown
}

export const AddCustomerDrawer = forwardRef<AddCustomerDrawerRef>((_, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [customer, setCustomer] = useState<AddCustomerDrawerFragment | null | undefined>(null)
  const { isPremium } = useCurrentUser()
  const { isEdition, onSave } = useCreateEditCustomer({
    customer,
  })
  const [isShippingEqualBillingAddress, setIsShippingEqualBillingAddress] = useState(false)

  const formikProps = useFormik<CreateCustomerInput | UpdateCustomerInput>({
    initialValues: {
      customerType: customer?.customerType ?? null,
      name: customer?.name ?? '',
      firstname: customer?.firstname ?? '',
      lastname: customer?.lastname ?? '',
      externalId: customer?.externalId ?? '',
      externalSalesforceId: customer?.externalSalesforceId ?? '',
      legalName: customer?.legalName ?? undefined,
      legalNumber: customer?.legalNumber ?? undefined,
      taxIdentificationNumber: customer?.taxIdentificationNumber ?? undefined,
      currency: customer?.currency ?? undefined,
      phone: customer?.phone ?? undefined,
      email: customer?.email ?? undefined,
      addressLine1: customer?.addressLine1 ?? undefined,
      addressLine2: customer?.addressLine2 ?? undefined,
      state: customer?.state ?? undefined,
      country: customer?.country ?? undefined,
      city: customer?.city ?? undefined,
      zipcode: customer?.zipcode ?? undefined,
      shippingAddress: customer?.shippingAddress ?? undefined,
      timezone: customer?.timezone ?? undefined,
      url: customer?.url ?? undefined,
      integrationCustomers: [
        ...(!!customer?.netsuiteCustomer ? [customer?.netsuiteCustomer] : []),
        ...(!!customer?.anrokCustomer ? [customer?.anrokCustomer] : []),
        ...(!!customer?.xeroCustomer ? [customer?.xeroCustomer] : []),
        ...(!!customer?.hubspotCustomer ? [customer?.hubspotCustomer] : []),
        ...(!!customer?.salesforceCustomer ? [customer?.salesforceCustomer] : []),
      ],
      paymentProviderCode: customer?.paymentProviderCode ?? undefined,
      providerCustomer: {
        providerCustomerId: customer?.providerCustomer?.providerCustomerId ?? '',
        syncWithProvider: customer?.providerCustomer?.syncWithProvider ?? false,
        providerPaymentMethods: customer?.providerCustomer?.providerPaymentMethods?.length
          ? customer?.providerCustomer?.providerPaymentMethods
          : customer?.currency !== CurrencyEnum.Eur
            ? [ProviderPaymentMethodsEnum.Card]
            : [ProviderPaymentMethodsEnum.Card, ProviderPaymentMethodsEnum.SepaDebit],
      },
      paymentProvider: customer?.paymentProvider ?? undefined,
      metadata: customer?.metadata ?? undefined,
    },
    validationSchema: object().shape({
      customerType: string().oneOf(Object.values(CustomerTypeEnum)).nullable(),
      name: string(),
      firstname: string(),
      lastname: string(),
      email: string().email('text_620bc4d4269a55014d493fc3'),
      externalId: string().required(''),
      metadata: metadataSchema(),
      providerCustomer: object().test({
        test: function (value: Omit<ProviderCustomer, 'id'>, { from }) {
          // Value can be undefined if no paymentProvider is selected
          if (value && from && from[1] && !from[1].value.paymentProvider) {
            return true
          }

          // if code is not selected, validation fails
          if (value && from && from[1] && !from[1].value.paymentProviderCode) {
            return false
          }

          // if syncWithProvider is false, providerCustomerId is required
          if (!value?.syncWithProvider && !value?.providerCustomerId) {
            return false
          }

          return true
        },
      }),
      integrationCustomers: array()
        .of(
          object()
            .test({
              test: function (
                value:
                  | Omit<NetsuiteCustomer, 'id'>
                  | Omit<AnrokCustomer, 'id'>
                  | Omit<XeroCustomer, 'id'>
                  | Omit<HubspotCustomer, 'id'>
                  | Omit<SalesforceCustomer, 'id'>,
              ) {
                if (!!value) {
                  if (value.integrationType === IntegrationTypeEnum.Netsuite) {
                    value = value as NetsuiteCustomer
                    // If Netsuite integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // If syncWithProvider is true but no subsidiary is selected
                    if (value?.syncWithProvider && !value?.subsidiaryId) {
                      return false
                    }
                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Anrok) {
                    value = value as AnrokCustomer
                    // If Anrok integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Xero) {
                    value = value as XeroCustomer
                    // If Xero integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Hubspot) {
                    value = value as HubspotCustomer
                    // If Hubspot integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // targetedObject needs to be selected
                    if (!value?.targetedObject) {
                      return false
                    }

                    // if syncWithProvider is false, externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  } else if (value.integrationType === IntegrationTypeEnum.Salesforce) {
                    value = value as SalesforceCustomer

                    // If Salesforce integrationCode is not selected
                    if (!value.integrationCode) {
                      return false
                    }

                    // if syncWithProvider is false then externalCustomerId is required
                    if (!value?.syncWithProvider && !value?.externalCustomerId) {
                      return false
                    }
                  }
                }

                return true
              },
            })
            .nullable(),
        )
        .nullable(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async ({ metadata, ...values }, formikBag) => {
      const answer = await onSave({
        ...values,
        metadata: ((metadata as LocalCustomerMetadata[]) || []).map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ localId, ...rest }) => rest,
        ),
      })

      const { errors } = answer

      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        formikBag.setFieldError('externalId', translate('text_626162c62f790600f850b728'))
      } else {
        ;(ref as unknown as RefObject<DrawerRef>)?.current?.closeDrawer()
        !isEdition && formikBag.resetForm()
      }
    },
  })
  const { timezoneConfig } = useOrganizationInfos()

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setCustomer(data)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  useEffect(() => {
    if (isShippingEqualBillingAddress) {
      formikProps.setFieldValue('shippingAddress', {
        addressLine1: formikProps.values.addressLine1,
        addressLine2: formikProps.values.addressLine2,
        city: formikProps.values.city,
        country: formikProps.values.country,
        state: formikProps.values.state,
        zipcode: formikProps.values.zipcode,
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formikProps.values.addressLine1,
    formikProps.values.addressLine2,
    formikProps.values.city,
    formikProps.values.country,
    formikProps.values.state,
    formikProps.values.zipcode,
    isShippingEqualBillingAddress,
  ])

  return (
    <Drawer
      ref={drawerRef}
      title={translate(
        isEdition
          ? 'text_632b4acf0c41206cbcb8c2f6'
          : customer?.name
            ? 'text_632b49e2620ea4c6d96c9650'
            : 'text_632b49e2620ea4c6d96c9652',
        {
          customerName: customer?.name || '',
        },
      )}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      showCloseWarningDialog={formikProps.dirty}
    >
      <DrawerContent>
        <DrawerTitle>
          <Typography variant="headline">
            {translate(
              isEdition ? 'text_632b4acf0c41206cbcb8c2f8' : 'text_632b49e2620ea4c6d96c9652',
            )}
          </Typography>
          <Typography>
            {translate(
              isEdition ? 'text_632b4acf0c41206cbcb8c2fa' : 'text_632b49e2620ea4c6d96c9654',
            )}
          </Typography>
        </DrawerTitle>

        <Card className="items-stretch">
          <Typography variant="subhead">{translate('text_626c0c09812bbc00e4c59df1')}</Typography>
          <ComboBoxField
            name="customerType"
            label={translate('text_1726128938631ioz4orixel3')}
            placeholder={translate('text_17261289386318j0nhr1ms3t')}
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
            data={Object.values(CustomerTypeEnum).map((customerValue) => ({
              value: customerValue,
              label: translate(TRANSLATIONS_MAP_CUSTOMER_TYPE[customerValue]),
            }))}
          />
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={!isEdition}
            name="name"
            label={translate('text_624efab67eb2570101d117be')}
            placeholder={translate('text_624efab67eb2570101d117c6')}
            formikProps={formikProps}
          />
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <TextInputField
                name="firstname"
                label={translate('text_1726128938631ggtf2ggqs4b')}
                placeholder={translate('text_1726128938631ntcpbzv7x7s')}
                formikProps={formikProps}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextInputField
                name="lastname"
                label={translate('text_1726128938631ymctg83bygm')}
                placeholder={translate('text_1726128938631xmpsba9ssuo')}
                formikProps={formikProps}
              />
            </Grid>
          </Grid>
          <TextInputField
            name="externalId"
            disabled={isEdition && !customer?.canEditAttributes}
            label={translate('text_624efab67eb2570101d117ce')}
            placeholder={translate('text_624efab67eb2570101d117d6')}
            helperText={
              (!isEdition || customer?.canEditAttributes) &&
              translate('text_624efab67eb2570101d117de')
            }
            formikProps={formikProps}
          />
          <ComboBoxField
            name="timezone"
            label={translate('text_6390a4ffef9227ba45daca90')}
            placeholder={translate('text_6390a4ffef9227ba45daca92')}
            disabled={!isPremium}
            helperText={
              <Typography
                variant="caption"
                html={translate('text_6390a4ffef9227ba45daca94', {
                  timezone: translate('text_638f743fa9a2a9545ee6409a', {
                    zone: timezoneConfig.name,
                    offset: timezoneConfig.offset,
                  }),
                  link: ORGANIZATION_INFORMATIONS_ROUTE,
                })}
              />
            }
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
            data={Object.values(TimezoneEnum).map((timezoneValue) => ({
              value: timezoneValue,
              label: translate('text_638f743fa9a2a9545ee6409a', {
                zone: translate(timezoneValue),
                offset: getTimezoneConfig(timezoneValue).offset,
              }),
            }))}
          />
          <TextInputField
            name="externalSalesforceId"
            label={translate('text_651fd3f644384c00999fbd81')}
            placeholder={translate('text_651fd408a57493006d00504e')}
            helperText={translate('text_651fd41846f44c0064408b07')}
            formikProps={formikProps}
          />
        </Card>
        <Accordion
          size="large"
          summary={
            <Typography variant="subhead">{translate('text_632b49e2620ea4c6d96c9662')}</Typography>
          }
        >
          <AccordionContentWrapper $largeSpacing>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_626c0c09812bbc00e4c59dff')}
            </Typography>
            <ComboBoxField
              disabled={!!customer && !customer?.canEditAttributes}
              label={translate('text_632c6e59b73f9a54d4c72247')}
              placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
              infoText={translate(
                !customer?.canEditAttributes && isEdition
                  ? 'text_632c6e59b73f9a54d4c7223d'
                  : 'text_632c6e59b73f9a54d4c7223f',
              )}
              name="currency"
              data={Object.values(CurrencyEnum).map((currencyType) => ({
                value: currencyType,
              }))}
              disableClearable
              formikProps={formikProps}
            />
            <TextInputField
              name="legalName"
              label={translate('text_626c0c09812bbc00e4c59e01')}
              placeholder={translate('text_626c0c09812bbc00e4c59e03')}
              formikProps={formikProps}
            />
            <TextInputField
              name="legalNumber"
              label={translate('text_626c0c09812bbc00e4c59e05')}
              placeholder={translate('text_626c0c09812bbc00e4c59e07')}
              formikProps={formikProps}
            />
            <TextInputField
              name="taxIdentificationNumber"
              label={translate('text_648053ee819b60364c675d05')}
              placeholder={translate('text_648053ee819b60364c675d0b')}
              formikProps={formikProps}
            />
            <TextInputField
              name="email"
              beforeChangeFormatter={['lowercase']}
              label={translate('text_626c0c09812bbc00e4c59e09')}
              placeholder={translate('text_626c0c09812bbc00e4c59e0b')}
              formikProps={formikProps}
              helperText={translate('text_641394c4c936000079c5639a')}
            />

            <TextInputField
              name="url"
              label={translate('text_641b15b0df87eb00848944ea')}
              placeholder={translate('text_641b15e7ac746900b68377f9')}
              formikProps={formikProps}
            />
            <TextInputField
              name="phone"
              label={translate('text_626c0c09812bbc00e4c59e0d')}
              placeholder={translate('text_626c0c09812bbc00e4c59e0f')}
              formikProps={formikProps}
            />
          </AccordionContentWrapper>
          <AccordionContentWrapper>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_626c0c09812bbc00e4c59e19')}
            </Typography>
            <TextInputField
              name="addressLine1"
              label={translate('text_626c0c09812bbc00e4c59e1b')}
              placeholder={translate('text_626c0c09812bbc00e4c59e1d')}
              formikProps={formikProps}
            />
            <TextInputField
              name="addressLine2"
              placeholder={translate('text_626c0c09812bbc00e4c59e1f')}
              formikProps={formikProps}
            />
            <TextInputField
              name="zipcode"
              placeholder={translate('text_626c0c09812bbc00e4c59e21')}
              formikProps={formikProps}
            />
            <TextInputField
              name="city"
              placeholder={translate('text_626c0c09812bbc00e4c59e23')}
              formikProps={formikProps}
            />
            <TextInputField
              name="state"
              placeholder={translate('text_626c0c09812bbc00e4c59e25')}
              formikProps={formikProps}
            />
            <ComboBoxField
              data={countryDataForCombobox}
              name="country"
              placeholder={translate('text_626c0c09812bbc00e4c59e27')}
              formikProps={formikProps}
              PopperProps={{ displayInDialog: true }}
            />
          </AccordionContentWrapper>
          <AccordionContentWrapper>
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_667d708c1359b49f5a5a8230')}
            </Typography>
            <Checkbox
              label={translate('text_667d708c1359b49f5a5a8234')}
              value={isShippingEqualBillingAddress}
              onChange={() => setIsShippingEqualBillingAddress((prev) => !prev)}
            />
            <TextInputField
              name="shippingAddress.addressLine1"
              label={translate('text_626c0c09812bbc00e4c59e1b')}
              placeholder={translate('text_626c0c09812bbc00e4c59e1d')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
            />
            <TextInputField
              name="shippingAddress.addressLine2"
              placeholder={translate('text_626c0c09812bbc00e4c59e1f')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
            />
            <TextInputField
              name="shippingAddress.zipcode"
              placeholder={translate('text_626c0c09812bbc00e4c59e21')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
            />
            <TextInputField
              name="shippingAddress.city"
              placeholder={translate('text_626c0c09812bbc00e4c59e23')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
            />
            <TextInputField
              name="shippingAddress.state"
              placeholder={translate('text_626c0c09812bbc00e4c59e25')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
            />
            <ComboBoxField
              data={countryDataForCombobox}
              name="shippingAddress.country"
              placeholder={translate('text_626c0c09812bbc00e4c59e27')}
              formikProps={formikProps}
              disabled={isShippingEqualBillingAddress}
              PopperProps={{ displayInDialog: true }}
            />
          </AccordionContentWrapper>
        </Accordion>

        {/* External apps */}
        <ExternalAppsAccordion formikProps={formikProps} isEdition={isEdition} />

        <MetadataAccordion formikProps={formikProps} />

        <DrawerSubmitButton>
          <Button
            size="large"
            disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
            loading={formikProps.isSubmitting}
            fullWidth
            data-test="submit"
            onClick={formikProps.submitForm}
          >
            {translate(
              isEdition ? 'text_632b4acf0c41206cbcb8c30c' : 'text_632b49e2620ea4c6d96c9666',
            )}
          </Button>
        </DrawerSubmitButton>
      </DrawerContent>
    </Drawer>
  )
})

const AccordionContentWrapper = styled.div<{ $largeSpacing?: boolean }>`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  > *:not(:last-child) {
    margin-bottom: ${({ $largeSpacing }) => ($largeSpacing ? theme.spacing(6) : theme.spacing(4))};
  }
`

AddCustomerDrawer.displayName = 'AddCustomerDrawer'
