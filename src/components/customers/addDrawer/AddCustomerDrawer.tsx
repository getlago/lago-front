import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { array, object, string } from 'yup'

import { Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import { hasDefinedGQLError } from '~/core/apolloClient'
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
  UpdateCustomerInput,
  XeroCustomer,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { DrawerContent, DrawerSubmitButton, DrawerTitle } from '~/styles'

import { BillingAccordion } from './BillingAccordion'
import { CustomerInformation } from './CustomerInformation'
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

  const { isEdition, onSave } = useCreateEditCustomer({
    customer,
  })

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

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setCustomer(data)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

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

        <CustomerInformation formikProps={formikProps} isEdition={isEdition} customer={customer} />

        <BillingAccordion formikProps={formikProps} isEdition={isEdition} customer={customer} />

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

AddCustomerDrawer.displayName = 'AddCustomerDrawer'
